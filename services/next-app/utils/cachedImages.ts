import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { ImageProps, ImageMetadata } from "./types";

const s3 = new S3Client({
  apiVersion: "2006-03-01",
  region: "eu-central-1",
});

interface S3ErrorMetadata {
  httpStatusCode: number;
  requestId: string;
}

interface S3Error {
  $metadata: S3ErrorMetadata;
}

const getImageMetadata = async (
  bucket: string,
  key: string
): Promise<ImageMetadata | undefined> => {
  const getObjectMetadataCommand = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const objectMetadataResponse = await s3.send(getObjectMetadataCommand);

  if (objectMetadataResponse.Metadata) {
    const { width, height } = objectMetadataResponse.Metadata;
    return {
      height: Number(height),
      width: Number(width),
    };
  }
};

const listImageObjects = async (
  bucket: string,
  prefix: string
): Promise<string[]> => {
  let hasNext = true;
  let imageKeys: string[] = [];
  let nextMarker = undefined;

  while (hasNext) {
    const listObjectsCommand: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: nextMarker,
    });
    try {
      const listObjectsResponse = await s3.send(listObjectsCommand);
      if (
        listObjectsResponse.$metadata.httpStatusCode === 200 &&
        listObjectsResponse.Contents
      ) {
        for (const c of listObjectsResponse.Contents) {
          if (c.Key) {
            imageKeys.push(c.Key);
          }
        }
      }
      if (listObjectsResponse.ContinuationToken) {
        nextMarker = listObjectsResponse.ContinuationToken;
      } else {
        hasNext = false;
      }
    } catch (error) {
      const e = error as S3Error;
      const { httpStatusCode } = e.$metadata;
      if (httpStatusCode === 404) {
        // 404 = bucket not found
        console.warn(`Bucket ${bucket} does not exist`);
        hasNext = false;
      } else {
        throw e;
      }
    }
  }
  return imageKeys;
};

export const listImageProps = async (
  bucket: string,
  prefix: string
): Promise<ImageProps[]> => {
  const imageKeys = await listImageObjects(bucket, prefix);
  let imagePropsList: ImageProps[] = [];
  let imageIdx = 0;
  for (const key of imageKeys) {
    const imageMeta = await getImageMetadata(bucket, key);
    if (imageMeta) {
      imagePropsList.push({
        idx: imageIdx,
        filename: key.split("/").pop() || "",
        meta: {
          width: imageMeta.width,
          height: imageMeta.height,
        },
      });
      imageIdx++;
    }
  }
  return imagePropsList;
};

export const s3ImageLoader = ({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) => {
  return `https://${process.env.DISTRIBUTION_DOMAIN_NAME}/assets/gallery/w_${width}/${src}`;
};
