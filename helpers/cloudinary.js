require('dotenv').config();

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a base64 image to Cloudinary
 * @param {string} base64Data
 * @param {string} publicId
 * @returns {{ imageUrl, imagePublicId }}
 */
async function uploadImage(base64Data, publicId) {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: 'oms/products',
    public_id: publicId,
    overwrite: true,
    resource_type: 'image',
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return {
    imageUrl: result.secure_url,
    imagePublicId: result.public_id,
  };
}

async function deleteImage(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

module.exports = { deleteImage, uploadImage };
