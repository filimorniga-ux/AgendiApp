import { useState } from 'react';
import { storage } from '../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const useStorage = () => {
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    const [url, setUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const uploadFile = async (file, path) => {
        setIsUploading(true);
        setError(null);
        setProgress(0);

        return new Promise((resolve, reject) => {
            if (!file) {
                setError("No file selected");
                setIsUploading(false);
                reject("No file selected");
                return;
            }

            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(percentage);
                },
                (err) => {
                    setError(err);
                    setIsUploading(false);
                    reject(err);
                },
                async () => {
                    try {
                        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                        setUrl(downloadUrl);
                        setIsUploading(false);
                        resolve(downloadUrl);
                    } catch (err) {
                        setError(err);
                        setIsUploading(false);
                        reject(err);
                    }
                }
            );
        });
    };

    return { progress, error, url, isUploading, uploadFile };
};
