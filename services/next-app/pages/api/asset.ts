import type { NextApiRequest, NextApiResponse } from "next";
import multiparty from "multiparty";
import { promises as fs } from "fs";
import formidable, { Fields, Files, Part } from "formidable";
import { Writable } from "stream";
import stream from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";

export async function POST(request: NextApiRequest) {}
import {
  S3Client,
  ListObjectsV2Command,
  HeadObjectCommand,
  S3ClientConfig,
  PutObjectCommand,
  PutObjectCommandInput,
  PutObjectAclCommandOutput,
} from "@aws-sdk/client-s3";

const formidableConfig = {
  keepExtensions: true,
  maxFileSize: 1024 * 1024 * 20, // 20mb
  allowEmptyFiles: false,
  multiples: false,
  maxFiles: 1,
  filename: (_name: string, _ext: string, part: Part) => {
    return `${_name}${_ext}`;
  },
  filter: (part: Part) => {
    return part.mimetype?.includes("image") || false;
  },
};

const s3 = new S3Client({
  apiVersion: "2006-03-01",
  region: "eu-central-1",
});

//set bodyparser
export const config = {
  api: {
    bodyParser: false,
  },
};

function handleFileUpload(
  req: NextApiRequest
): Promise<{ fields: Fields; files: Files }> {
  // see: https://www.linkedin.com/pulse/stream-file-uploads-s3-object-storage-save-money-austin-gil/
  return new Promise((accept, reject) => {
    const s3Uploads: Promise<void>[] = [];

    const fileWriteStreamHandler = (file: any): Writable => {
      const body = new stream.PassThrough();
      const upload = new Upload({
        client: s3,
        params: {
          Bucket: "asset-bucket-cfn-next",
          Key: `assets/uploads/gallery/${file.originalFilename}`,
          ContentType: file.mimetype || undefined,
          Body: body,
        },
      });
      const uploadRequest = upload.done().then((response) => {
        file.location = response.Location;
      });
      s3Uploads.push(uploadRequest);
      return body;
    };

    const form = formidable({
      ...formidableConfig,
      fileWriteStreamHandler: fileWriteStreamHandler,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      Promise.all(s3Uploads)
        .then(() => {
          accept({ fields, files });
        })
        .catch(reject);
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!(req.method === "POST")) {
    res.status(405).end();
  }
  try {
    await handleFileUpload(req);
    res.status(201).end();
  } catch (e) {
    res.status(500).json(e);
  }
}
