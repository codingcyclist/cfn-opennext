import re
from enum import Enum
from io import BytesIO
from pathlib import Path

import boto3
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.data_classes import S3Event, event_source
from aws_lambda_powertools.utilities.typing import LambdaContext
from botocore.exceptions import ClientError
from PIL import Image, ImageOps

s3 = boto3.client("s3")

logger = Logger()

WIDTHS = [180, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]


def handle_resize_image(bucket: str, key_src: str) -> None:
    """
    Handle resizing of uploaded images
    Args:
        bucket (str): Bucket name
        key_src (str): assets/uploads/<subfolder>/<filename>
    """
    try:
        download_buffer = BytesIO()
        s3.download_fileobj(Bucket=bucket, Key=key_src, Fileobj=download_buffer)
    except ClientError as e:
        if "404" in str(e):
            logger.error(f"Image '{key_src}' not found")
            return
        else:
            raise e

    image = Image.open(download_buffer)
    image = ImageOps.exif_transpose(
        image
    )  # see: https://github.com/python-pillow/Pillow/issues/4703
    original_width = image.width
    original_height = image.height
    logger.info(f"Original dimensions: {original_width} x {original_height}")
    for w in WIDTHS:
        resize_ratio = min(w / original_width, 1)
        new_size = (
            int(original_width * resize_ratio),
            int(original_height * resize_ratio),
        )
        target_key = re.sub(
            r"^assets\/uploads\/(.+)\/(.+)$",
            r"assets/\g<1>/w_" + str(w) + r"/\g<2>",
            key_src,
        )
        logger.info(f"Re-sizing '{key_src}' -> '{target_key}' (bucket: {bucket})")
        logger.info(f"Target dimensions: {new_size[0]} x {new_size[1]}")
        resized_image = image.resize(new_size)

        upload_buffer = BytesIO()
        out_format = "PNG" if Path(key_src).suffix.lower() == ".png" else "JPEG"
        if out_format == "JPEG":
            # see: https://stackoverflow.com/a/48248432
            resized_image = resized_image.convert("RGB")
        resized_image.save(upload_buffer, format=out_format)
        upload_buffer.seek(0)

        s3.upload_fileobj(
            Fileobj=upload_buffer,
            Bucket=bucket,
            Key=target_key,
            ExtraArgs={
                "Metadata": {
                    "original_width": f"{original_width}",
                    "original_height": f"{original_height}",
                    "width": f"{new_size[0]}",
                    "height": f"{new_size[1]}",
                }
            },
        )

    target_key = re.sub(
        r"^assets\/uploads\/(.+)\/(.+)$",
        r"assets/\g<1>/originals/\g<2>",
        key_src,
    )
    logger.info(f"Uploading original to {target_key}")
    s3.upload_fileobj(
        Fileobj=download_buffer,
        Bucket=bucket,
        Key=target_key,
        ExtraArgs={
            "Metadata": {
                "original_width": f"{original_width}",
                "original_height": f"{original_height}",
                "width": f"{original_width}",
                "height": f"{original_height}",
            }
        },
    )
    deleted_res = s3.delete_object(Bucket=bucket, Key=key_src)
    if not deleted_res["ResponseMetadata"]["HTTPStatusCode"] == 204:
        logger.error(f"Failed to delete uploaded file s3://{bucket}/{key_src}")
    else:
        logger.error(f"Deleted original from s3://{bucket}/{key_src} after resizing")


def handle_delete_images(bucket: str, key_src: str) -> None:
    """
    Handle deletion of images
    Args:
        bucket (str): Bucket name
        key_src (str): assets/<subfolder>/originals/<filename>
    """
    search_key = re.sub(
        r"^assets\/(.+)\/(.+)\/(.+)$",
        r"assets/\g<1>",
        key_src,
    )
    filename = re.search(r"^assets\/(.+)\/(.+)\/(.+)$", key_src).group(  # type: ignore
        3
    )
    for obj in s3.list_objects_v2(Bucket=bucket, Prefix=search_key)["Contents"]:
        if not re.search(r"^assets\/[^\/]+\/w\_\d+\/" + filename, obj["Key"]):
            continue
        deleted_res = s3.delete_object(Bucket=bucket, Key=obj["Key"])
        if not deleted_res["ResponseMetadata"]["HTTPStatusCode"] == 204:
            logger.error(f"Failed to delete s3://{bucket}/{obj['Key']}")
        else:
            logger.info(f"Deleted s3://{bucket}/{obj['Key']}")


@logger.inject_lambda_context(clear_state=True)
@event_source(data_class=S3Event)
def handler(event: S3Event, context: LambdaContext):
    for record in event.records:
        obj_key = record.s3.get_object.key
        bucket_name = record.s3.bucket.name
        if re.search(
            # only handle uploads to assets/uploads, not it's parent folders
            r"^assets\/uploads\/[^\/]+\/[^\/]+\.(jpg|jpeg|JPG|JPEG|PNG|png)$",
            obj_key,
        ) and re.search(r"^ObjectCreated:.+$", record.event_name):
            handle_resize_image(bucket=bucket_name, key_src=obj_key)
        if re.search(
            # only handle deletes from assets/{}/originals, not it's parent folders
            r"^assets\/[^\/]+\/originals\/[^\/]+\.(jpg|jpeg|JPG|JPEG|PNG|png)$",
            obj_key,
        ) and re.search(r"^ObjectRemoved:.+$", record.event_name):
            handle_delete_images(bucket=bucket_name, key_src=obj_key)
