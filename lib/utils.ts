import { clsx, type ClassValue } from "clsx"
import { v4 as uuidv4 } from 'uuid';
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 *
 * @param {String} file_name
 * @returns {Object}
 */

async function generateS3PostURL(file_name: string, file_type: string) {
  let postURL = await fetch("https://pinenlime.com/_functions/uploadImage", {
    method: "POST",
    headers: new Headers({ "content-type": "application/json" }),
    body: JSON.stringify({ file_name: file_name, file_type: file_type, bucketFolder: "JourneyMap" }),
  }).then((res) => res.json());

  return postURL;
}

export async function uploadToS3(blobFile: Blob, order_id?: string) {
  let s3Links = await generateS3PostURL(order_id ?? uuidv4(), blobFile.type);
  let temp = new URL(s3Links.objectURL)
  s3Links.objectURL = temp.protocol + "//" + temp.host + temp.pathname
  return await fetch(s3Links.url, {
    method: "PUT",
    headers: { "Content-Type": blobFile.type },
    body: blobFile,
  })
    .then((res) => {
      return { url: s3Links.objectURL };
    })
    .catch((err) => {
      throw err;
    });
}