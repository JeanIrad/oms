// const cds = require('@sap/cds');
// const multer = require('multer');
// const { deleteImage, uploadImage } = require('./srv/helpers/cloudinary');

// const upload = multer({ storage: multer.memoryStorage() });

// cds.on('served', () => {
//   const app = cds.app;
//   app.post(
//     '/oms/uploadProductImage',
//     upload.single('image'),
//     async (req, res) => {
//       try {
//         // Auth check — pull from CAP's session
//         const user = await req.user;

//         console.log('USER REQUESTING>>>', user);
//         // if (!user?.is('admin')) {
//         //   return res.status(403).json({ error: 'Admin access required.' });
//         // }

//         const { productId, fileName } = req.body;
//         console.log('product ID<<<<', productId);
//         console.log('FileName ID<<<<', fileName);

//         if (!productId)
//           return res.status(400).json({ error: 'productId is required.' });
//         if (!req.file)
//           return res.status(400).json({ error: 'image file is required.' });

//         // Convert buffer to base64 data URI for cloudinary
//         const mime = req.file.mimetype;
//         const base64 = req.file.buffer.toString('base64');
//         const imageData = `data:${mime};base64,${base64}`;

//         const db = await cds.connect.to('db');

//         const product = await db.run(
//           SELECT.one('oms.Products').where({ ID: productId }),
//         );

//         if (!product)
//           return res.status(404).json({ error: `Product not found.` });

//         if (product.imagePublicId) {
//           await deleteImage(product.imagePublicId);
//         }

//         const slug = (fileName || productId)
//           .replace(/\.[^/.]+$/, '')
//           .replace(/[^a-z0-9]/gi, '_')
//           .toLowerCase();

//         const { imageUrl, imagePublicId } = await uploadImage(imageData, slug);

//         await db.run(
//           UPDATE('oms.Products')
//             .set({ imageUrl, imagePublicId })
//             .where({ ID: productId }),
//         );

//         return res.status(200).json({ imageUrl, imagePublicId });
//       } catch (err) {
//         console.error('Upload error:', err);
//         return res.status(500).json({ error: err.message });
//       }
//     },
//   );
// });

// module.exports = cds.server;
