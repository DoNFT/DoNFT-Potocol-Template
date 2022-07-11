import bz2
import os
from tempfile import NamedTemporaryFile
from typing import Dict
from typing import Optional
from typing import Tuple, Union

# import dlib
import imageio
import numpy as np
import tensorflow as tf

from common.api.effects.services.base_effect_service import BaseEffectService


# from facenet_pytorch import MTCNN


class StyleTransferEffectService(BaseEffectService):
    def __init__(self, hub_model, crop=True, face_align=False):
        self.hub_model = hub_model
        self.crop = crop
        self.face_align = face_align

    @staticmethod
    def crop_center(image):
        """Returns a cropped square image."""
        shape = image.shape
        new_shape = min(shape[1], shape[2])
        offset_y = max(shape[1] - shape[2], 0) // 4
        offset_x = max(shape[2] - shape[1], 0) // 4
        image = tf.image.crop_to_bounding_box(
            image, offset_y, offset_x, new_shape, new_shape)
        return image

    @staticmethod
    def load_img(img_content: bytes, image_size: Union[Tuple[int, int], int]):
        max_dim = 512
        with NamedTemporaryFile() as path_to_img:
            path_to_img.write(img_content)
            path_to_img.seek(0)
            img = tf.io.read_file(path_to_img.name)
        img = tf.image.decode_image(img, channels=3)
        img = tf.image.convert_image_dtype(img, tf.float32)

        shape = tf.cast(tf.shape(img)[:-1], tf.float32)
        long_dim = max(shape)
        scale = max_dim / long_dim

        new_shape = tf.cast(shape * scale, tf.int32)

        img = tf.image.resize(img, new_shape)
        img = img[tf.newaxis, :]
        img = tf.image.resize(img, image_size, preserve_aspect_ratio=True)
        return img

    def _perform_transformation(self, contents, params: Optional[Dict] = None,):
        output_image_size = 384

        content_img_size = (output_image_size, output_image_size)
        style_img_size = (256, 256)

        content_image = self.load_img(contents[0], content_img_size)
        if self.crop:
            content_image = self.crop_center(content_image)
        # if self.face_align:
        #     content_image = self.mtcnn(content_image)
        style_image = self.load_img(contents[1], style_img_size)
        style_image = tf.nn.avg_pool(style_image, ksize=[3, 3], strides=[1, 1], padding='SAME')

        outputs = self.hub_model(tf.constant(content_image), tf.constant(style_image))
        stylized_image = np.array(outputs[0]).squeeze(axis=0)
        return imageio.imwrite("<bytes>", np.array(stylized_image), "png")
