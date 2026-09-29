import { v2 as cloudinary } from 'cloudinary';

export async function enviarImagem(buffer) {
    const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET,
    } = process.env;

    if (
        !CLOUDINARY_CLOUD_NAME ||
        !CLOUDINARY_API_KEY ||
        !CLOUDINARY_API_SECRET
    ) {
        throw new Error('Configure as credenciais do Cloudinary no backend.');
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
    });

    return new Promise((resolve, reject) => {
        const envio = cloudinary.uploader.upload_stream(
            {
                folder: 'barbershop-du-cortes',
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            },
            (error, resultado) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(resultado.secure_url);
            }
        );

        envio.end(buffer);
    });
}