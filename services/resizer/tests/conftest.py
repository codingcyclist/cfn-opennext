import datetime as dt
import typing as t
from enum import Enum
from pathlib import Path

import boto3
import pytest
from moto import mock_s3

TEST_BUCKET_NAME = "test_bucket"
AWS_REGION = "us-east-1"  # see: https://github.com/aws/aws-cli/issues/2603


class S3EventName(str, Enum):
    PUT = "ObjectCreated:Put"
    DELETE = "ObjectRemoved:Delete"
    DELETE_PENDING = "ObjectRemoved:DeleteMarkerCreated"


@pytest.fixture
def test_bucket() -> str:
    mock = mock_s3()
    mock.start()
    s3 = boto3.client("s3", region_name=AWS_REGION)
    s3.create_bucket(Bucket=TEST_BUCKET_NAME)
    yield TEST_BUCKET_NAME
    mock.stop()


@pytest.fixture
def test_lambda_context() -> t.Any:
    class Context:
        function_name = "test"
        memory_limit_in_mb = 512
        invoked_function_arn = "arn:aws:ec2:::test"
        aws_request_id = "test"

    return Context


def _make_s3_event(key: str, event_type: S3EventName) -> t.Dict[str, t.Any]:
    return {
        "Records": [
            {
                "eventVersion": "2.0",
                "eventSource": "aws:s3",
                "awsRegion": AWS_REGION,
                "eventTime": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
                "eventName": f"{event_type.value}",
                "userIdentity": {"principalId": "EXAMPLE"},
                "requestParameters": {"sourceIPAddress": "127.0.0.1"},
                "responseElements": {
                    "x-amz-request-id": "EXAMPLE123456789",
                    "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
                },
                "s3": {
                    "s3SchemaVersion": "1.0",
                    "configurationId": "testConfigRule",
                    "bucket": {
                        "name": TEST_BUCKET_NAME,
                        "ownerIdentity": {"principalId": "EXAMPLE"},
                        "arn": f"arn:aws:s3:::{TEST_BUCKET_NAME}",
                    },
                    "object": {
                        "key": key,
                        "size": 1024,
                        "eTag": "0123456789abcdef0123456789abcdef",
                        "sequencer": "0A1B2C3D4E5F678901",
                    },
                },
            }
        ]
    }


@pytest.fixture
def test_event_put_img_in_landingzone(test_bucket: str) -> t.Dict[str, t.Any]:
    s3 = boto3.client("s3", region_name=AWS_REGION)
    key = "assets/uploads/foobar/test.jpg"
    with open(Path(__file__).parent / "assets" / "test.jpg", "rb") as f:
        s3.upload_fileobj(Fileobj=f, Bucket=test_bucket, Key=key)
    return _make_s3_event(key=key, event_type=S3EventName.PUT)


@pytest.fixture
def test_event_remove_img_from_landingzone(test_bucket: str) -> t.Dict[str, t.Any]:
    s3 = boto3.client("s3", region_name=AWS_REGION)
    key_pattern = "assets/foobar/w_{}/test.jpg"
    for w in [100, 200, 300]:
        with open(Path(__file__).parent / "assets" / "test.jpg", "rb") as f:
            s3.upload_fileobj(Fileobj=f, Bucket=test_bucket, Key=key_pattern.format(w))
    return _make_s3_event(
        key="assets/uploads/foobar/test.jpg", event_type=S3EventName.DELETE_PENDING
    )


@pytest.fixture
def test_event_put_img_outside_landingzone(test_bucket: str) -> t.Dict[str, t.Any]:
    s3 = boto3.client("s3", region_name=AWS_REGION)
    key = "assets/foobar/test.jpg"
    with open(Path(__file__).parent / "assets" / "test.jpg", "rb") as f:
        s3.upload_fileobj(Fileobj=f, Bucket=test_bucket, Key=key)
    return _make_s3_event(key=key, event_type=S3EventName.PUT)
