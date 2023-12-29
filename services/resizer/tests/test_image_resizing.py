import typing as t

import boto3

from app import WIDTHS, handler


def test_process_file_in_landingzone(
    test_event_put_img_in_landingzone: t.Dict[str, t.Any], test_lambda_context: t.Any
) -> None:
    s3 = boto3.client("s3")
    bucket_name = test_event_put_img_in_landingzone["Records"][0]["s3"]["bucket"][
        "name"
    ]
    uploaded_objects = s3.list_objects_v2(
        Bucket=bucket_name, Prefix="assets/uploads/foobar"
    )
    assert len(uploaded_objects["Contents"]) == 1
    handler(event=test_event_put_img_in_landingzone, context=test_lambda_context)
    remaining_objects_in_uploads_folder = s3.list_objects_v2(
        Bucket=bucket_name, Prefix="assets/uploads/foobar"
    )
    assert (
        "Contents" not in remaining_objects_in_uploads_folder
    )  # original file should have gotten deleted
    resized_objects = s3.list_objects_v2(Bucket=bucket_name, Prefix="assets/foobar")
    assert len(resized_objects["Contents"]) == len(WIDTHS) + 1


def test_remove_file_in_landingzone(
    test_event_remove_img_from_landingzone: t.Dict[str, t.Any],
    test_lambda_context: t.Any,
):
    s3 = boto3.client("s3")
    bucket_name = test_event_remove_img_from_landingzone["Records"][0]["s3"]["bucket"][
        "name"
    ]
    initial_objects = s3.list_objects_v2(Bucket=bucket_name, Prefix="assets/foobar")

    assert len(initial_objects["Contents"]) == 3
    handler(event=test_event_remove_img_from_landingzone, context=test_lambda_context)

    remaining_objects = s3.list_objects_v2(Bucket=bucket_name, Prefix="assets/foobar")
    assert "Contents" not in remaining_objects


def test_dont_process_files_that_are_not_images():
    pass


def test_dont_process_files_outside_of_landing_zone(
    test_event_put_img_outside_landingzone: t.Dict[str, t.Any],
    test_lambda_context: t.Any,
) -> None:
    handler(event=test_event_put_img_outside_landingzone, context=test_lambda_context)
    s3 = boto3.client("s3")
    bucket_name = test_event_put_img_outside_landingzone["Records"][0]["s3"]["bucket"][
        "name"
    ]
    uploaded_objects = s3.list_objects_v2(Bucket=bucket_name)
    assert len(uploaded_objects["Contents"]) == 1
