import { Router } from "tezx";

const my_documents = new Router({

});

// documents/bookmark
// my_documents.delete('/documents/bookmark/:doc_id', async (ctx) => {
//     const doc_id = ctx.req.params?.doc_id;
//     const user_id = ctx.auth?.user_info?.user_id || '';
//     if (!user_id) {
//         return ctx.json({
//             success: false,
//             message: "Please login first.",
//         })
//     }
//     if (!doc_id) {
//         return ctx.status(400).json({
//             success: false,
//             message: "Missing document ID.",
//         });
//     }

//     try {
//         const { success, result } = await db.delete(table_schema.document_bookmarks, {
//             where: db.condition({
//                 user_id: user_id,
//                 doc_id: doc_id,
//             }),
//         }).execute();

//         if (success) {
//             return ctx.json({
//                 success: true,
//                 message: "Bookmark removed successfully.",
//                 data: result,
//             });
//         } else {
//             return ctx.status(500).json({
//                 success: false,
//                 message: "Bookmark could not be removed.",
//             });
//         }
//     } catch (error) {
//         return ctx.status(500).json({
//             success: false,
//             message: "Internal server error while removing bookmark.",
//         });
//     }
// });

// my_documents.post('/documents/bookmark/:doc_id', async (ctx) => {
//     const doc_id = ctx.req.params?.doc_id;
//     const user_id = ctx.auth?.user_info?.user_id || '';
//     if (!user_id) {
//         return ctx.json({
//             success: false,
//             message: "Please login first.",
//         })
//     }
//     if (!doc_id) {
//         return ctx.status(400).json({
//             success: false,
//             message: "Missing document ID.",
//         },);
//     }

//     try {
//         const { success, result, errno } = await db.create(table_schema.document_bookmarks, {
//             user_id,
//             doc_id,
//         }).execute();
//         if (success) {
//             return ctx.json({
//                 success: true,
//                 message: "Bookmark added successfully.",
//                 data: result,
//             });
//         }
//         else {
//             if (errno == 1062) {
//                 return ctx.status(409).json({
//                     success: false,
//                     message: "Bookmark already exists.",
//                 });
//             }
//             return ctx.json({
//                 success: false,
//                 message: "Error creating bookmark. Please try again!"
//             })
//         }

//     } catch (error) {
//         return ctx.status(500).json({
//             success: false,
//             message: "Internal server error while creating bookmark.",
//         },);
//     }
// });



export default my_documents;