import { Video } from "@prisma/client";

import rabbitmq from "../lib/rabbitmq";
import { io } from "../app";
import { prisma } from "../lib/prisma";

export const processVideo = async (video: Video, filename: string) => {
    try {
        const connection = await rabbitmq;
        const channel = await connection.createChannel();

        await channel.assertQueue("processing-queue", {
            durable: true,
        });

        channel.sendToQueue(
            "processing-queue",
            Buffer.from(JSON.stringify(video))
        );

        channel.close();

        console.log("[PROCESS SERVICE] Video processing queued");

        // await prisma.video.update({
        //     where: { id: video.id },
        //     data: { status: "PROCESSING" },
        // });

        // io.to(`user:${video.user_id}`).emit("video_process_start");
    } catch (err) {
        console.error("[PROCESS SERVICE] Video processing request failed");
        console.error(err);

        await prisma.video.update({
            where: { id: video.id },
            data: { status: "FAILED" },
        });

        io.to(`user:${video.user_id}`).emit("video_process_failed");
    }

    // // Remplacez ces valeurs par les données appropriées
    // const apiUrl = process.env.PROCESS_URL!; // L'URL de l'API de téléchargement
    // const filePath = `${__dirname}/../../uploads/originals/${video.id}.mp4`; // Le chemin vers votre fichier
    // const videoId = video.id; // L'identifiant de la vidéo

    // // Créez un objet FormData
    // const formData = new FormData();

    // // Ajoutez le fichier et le video_id au formulaire
    // formData.set("video_id", videoId);
    // formData.set("video", new Blob([await readFile(filePath)]));

    // console.log("[PROCESS SERVICE] Requesting video processing...");

    // /**
    //  * Request video process
    //  */

    // try {
    //   const response = await retry(
    //     async (context) => {
    //       // console.log(context.attemptNum, context.attemptsRemaining);

    //       return fetch(apiUrl, {
    //         method: "POST",
    //         body: formData,
    //       });
    //     },
    //     {
    //       delay: 2000,
    //       maxAttempts: 10,
    //       factor: 2,
    //       maxDelay: 10000,
    //     }
    //   );

    //   console.log("[PROCESS SERVICE] Video processing request success");

    //   await prisma.video.update({
    //     where: { id: video.id },
    //     data: { status: "PROCESSING" },
    //   });

    //   io.to(`user:${video.user_id}`).emit("video_process_start");
    // } catch (err) {
    //   console.error("[PROCESS SERVICE] Video processing request failed");
    //   console.error(err);

    //   await prisma.video.update({
    //     where: { id: video.id },
    //     data: { status: "FAILED" },
    //   });

    //   io.to(`user:${video.user_id}`).emit("video_process_failed");
    // }
};
