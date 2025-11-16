import { insert } from "@tezx/sqlx/mysql";
import { Router } from "tezx";
import { dbQuery, TABLES } from "../../../../models/index.js";
import { DirectoryServe, filename } from "../../../../config.js";
import { copyFile } from "../../../../utils/fileExists";
const gymReviews = new Router({
    basePath: 'reviews'
});
gymReviews.post("/:gym_id/add", async (ctx) => {
    const gym_id = Number(ctx.req.params?.gym_id);
    const { user_info } = ctx.auth || {};
    const user_id = user_info?.user_id;

    if (!gym_id) {
        return ctx.json({ success: false, message: "Gym ID is required" });
    }

    try {
        const body = await ctx.req.json();
        const { feedback_type, video_url, comment, rating, trainer_id, client_id } = body;
        if (!rating || rating < 1 || rating > 5) {
            return ctx.status(404).json({ success: false, message: "Rating must be between 1 and 5" });
        }
        // CREATE TABLE
        //         gym_feedbacks(
        //             gym_id BIGINT UNSIGNED NOT NULL,
        //             client_id BIGINT UNSIGNED DEFAULT NULL, --Client giving the feedback
        //         trainer_id BIGINT UNSIGNED DEFAULT NULL, --Trainer giving the feedback
        //         rating TINYINT UNSIGNED NOT NULL CHECK(rating BETWEEN 1 AND 5),
        //             reply TEXT DEFAULT NULL,
        //             feedback_type ENUM('client', 'trainer') NOT NULL,
        //             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        //             updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        //             FOREIGN KEY(gym_id) REFERENCES gyms(gym_id) ON DELETE CASCADE,
        //             FOREIGN KEY(client_id) REFERENCES clients(client_id) ON DELETE SET NULL,
        //             FOREIGN KEY(trainer_id) REFERENCES trainers(trainer_id) ON DELETE SET NULL
        //         ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

        let f_video_url = '';
        if (video_url) {
            if (await copyFile(video_url, DirectoryServe.feedback.gym(video_url), true)) {
                f_video_url = filename(video_url);
            }
        }
        const sql = insert(TABLES.FEEDBACK.GYM_TRAINER_CLIENT, {
            gym_id,
            feedback_type,
            comment,
            rating,
            trainer_id,
            client_id,
            video_url: f_video_url || undefined
        });
        const { success, result, error } = await dbQuery<any>(sql);

        if (!success) {
            console.error("DB error:", error);
            return ctx.json({ success: false, message: "Database error", error });
        }

        return ctx.json({
            success: true,
            message: "Feedback submitted successfully",
            feedback_id: result?.insertId
        });
    }
    catch (err) {
        return ctx.json({
            success: false,
            message: "Internal server error"
        });
    }
})
export default gymReviews;