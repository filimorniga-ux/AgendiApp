import { useState } from 'react';
import { supabase } from '../supabase/client';

export const useStorage = () => {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [url, setUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file, path) => {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        return new Promise(async (resolve, reject) => {
            if (!file) {
                setError("No file selected");
                setIsUploading(false);
                return reject("No file selected");
            }

            try {
                // Generar nombre de archivo único
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
                const fullPath = `${path}/${fileName}`;

                // Subir a Supabase Storage (requiere bucket 'media')
                const { data, error: uploadError } = await supabase.storage
                    .from('media')
                    .upload(fullPath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    throw uploadError;
                }

                setProgress(100);

                // Obtener URL pública
                const { data: { publicUrl } } = supabase.storage
                    .from('media')
                    .getPublicUrl(fullPath);

                setUrl(publicUrl);
                setIsUploading(false);
                resolve(publicUrl);
            } catch (err) {
                console.warn("[Storage] upload error:", err?.message || 'Unknown');
                setError(err);
                setIsUploading(false);
                reject(err);
            }
        });
    };

    return { progress, error, url, isUploading, uploadFile };
};
