import logging
import traceback
from helpers.custom_exception import convert_exception_string_to_one_line
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
from decouple import config


logger = logging.getLogger("stdout")

CLOUDINARY_CLOUD_NAME = config("CLOUDINARY_CLOUD_NAME", default="")
CLOUDINARY_API_KEY = config("CLOUDINARY_API_KEY", default="")
CLOUDINARY_API_SECRET = config("CLOUDINARY_API_SECRET", default="")


def upload_image_to_cloudinary(image_file) -> str:
    try:
        # Configuration
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME, api_key=CLOUDINARY_API_KEY, api_secret=CLOUDINARY_API_SECRET, secure=True
        )

        # Upload an image
        upload_result = cloudinary.uploader.upload(image_file)
        return upload_result["secure_url"]
    except Exception:
        logger.error(
            {
                "message": "Couldn't upload image to cloudinary.",
                "image_file": image_file,
                "error": convert_exception_string_to_one_line(traceback.format_exc()),
            }
        )
        return ""
