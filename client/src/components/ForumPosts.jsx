import { useEffect, useState } from "react";

function ForumPosts({ leagueId }) {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [teamId, setTeamId] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [postToDelete, setPostToDelete] = useState(null);
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [commentsMap, setCommentsMap] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [commentSubmitting, setCommentSubmitting] = useState({});
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editingContent, setEditingContent] = useState("");

    useEffect(() => {
        fetchPosts();
        fetchMyTeamId();
    }, [leagueId]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`https://localhost:7119/api/forum/league/${leagueId}`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setPosts(data);
        } catch (err) {
            console.error("Failed to fetch posts:", err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTeamId = async () => {
        try {
            const res = await fetch("https://localhost:7119/api/team/my", {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            const myTeam = data.find((t) => t.leagueId === parseInt(leagueId));
            if (myTeam) setTeamId(myTeam.id);
        } catch (err) {
            console.error("Failed to fetch user's team:", err.message);
        }
    };

    const fetchComments = async (postId) => {
        try {
            const res = await fetch(`https://localhost:7119/api/forum/${postId}/comments`);
            if (!res.ok) throw new Error(await res.text());
            const data = await res.json();
            setCommentsMap((prev) => ({ ...prev, [postId]: data }));
        } catch (err) {
            console.error("Failed to fetch comments:", err.message);
        }
    };

    const handleToggleComments = async (postId) => {
        if (expandedPostId === postId) {
            setExpandedPostId(null);
        } else {
            if (!commentsMap[postId]) await fetchComments(postId);
            setExpandedPostId(postId);
        }
    };

    const handleCommentSubmit = async (postId) => {
        const content = commentInputs[postId];
        if (!content || !teamId) return;

        setCommentSubmitting((prev) => ({ ...prev, [postId]: true }));
        try {
            const res = await fetch(`https://localhost:7119/api/forum/comment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    postId,
                    teamId,
                    content,
                }),
            });

            if (!res.ok) throw new Error(await res.text());
            setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
            await fetchComments(postId);
        } catch (err) {
            alert("Failed to add comment: " + err.message);
        } finally {
            setCommentSubmitting((prev) => ({ ...prev, [postId]: false }));
        }
    };
    const handleUpdateComment = async (commentId) => {
        try {
            const res = await fetch(
                `https://localhost:7119/api/forum/comment/${commentId}?teamId=${teamId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify(editingContent),
                }
            );
            if (!res.ok) throw new Error(await res.text());
            await fetchComments(expandedPostId);
            setEditingCommentId(null);
        } catch (err) {
            alert("Failed to update comment: " + err.message);
        }
    };

    const handleDeleteComment = async (commentId) => {
        try {
            const res = await fetch(
                `https://localhost:7119/api/forum/comment/${commentId}?teamId=${teamId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (!res.ok) throw new Error(await res.text());
            await fetchComments(expandedPostId);
        } catch (err) {
            alert("Failed to delete comment: " + err.message);
        }
    };

    const handleEditPost = (post) => {
        setEditingPost(post);
        setTitle(post.title);
        setContent(post.content);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!title || !content) return alert("Title and content are required");
        if (!teamId) return alert("You must have a team in this league to post.");

        setSubmitting(true);
        try {
            const payload = { title, content };
            const url = editingPost
                ? `https://localhost:7119/api/forum/${editingPost.id}`
                : `https://localhost:7119/api/forum/add`;
            const method = editingPost ? "PUT" : "POST";
            const body = editingPost
                ? JSON.stringify(payload)
                : JSON.stringify({ ...payload, leagueId: parseInt(leagueId), teamId });

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body,
            });

            if (!res.ok) throw new Error(await res.text());
            await fetchPosts();
            setShowModal(false);
            setTitle("");
            setContent("");
            setEditingPost(null);
        } catch (err) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!postToDelete || !teamId) return;
        try {
            const res = await fetch(
                `https://localhost:7119/api/forum/${postToDelete.id}?teamId=${teamId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            );
            if (!res.ok) throw new Error(await res.text());
            await fetchPosts();
            setPostToDelete(null);
        } catch (err) {
            alert("Failed to delete post: " + err.message);
        }
    };

    if (loading) return <p>Loading posts...</p>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Forum</h2>
                <button
                    onClick={() => {
                        setEditingPost(null);
                        setTitle("");
                        setContent("");
                        setShowModal(true);
                    }}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded font-semibold"
                >
                    Create Post
                </button>
            </div>

            {posts.map((post) => (
                <div
                    key={post.id}
                    className="bg-white rounded-xl shadow-md p-6 border border-gray-200 transition hover:shadow-lg"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{post.title}</h3>
                            <p className="text-sm text-gray-500 mb-3">
                                By <span className="font-medium text-gray-700">{post.teamName}</span> on{" "}
                                {new Date(post.createdAt).toLocaleString()}
                            </p>
                        </div>
                        {post.teamId === teamId && (
                            <div className="flex items-center gap-2">
                                <button title="Edit" onClick={() => handleEditPost(post)} className="text-xl">
                                    ✏️
                                </button>
                                <button
                                    title="Delete"
                                    onClick={() => setPostToDelete(post)}
                                    className="text-xl text-red-500"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>
                    <p className="text-gray-800 mb-3">{post.content}</p>
                    <div className="flex justify-center">
                        <button
                            onClick={() => handleToggleComments(post.id)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            {expandedPostId === post.id ? "Hide Comments" : "View Comments"}
                        </button>
                    </div>

                    {expandedPostId === post.id && (
                        <div className="mt-4 space-y-3 border-t pt-4">
                            {(commentsMap[post.id] || []).length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No comments yet.</p>
                            ) : (
                                commentsMap[post.id].map((c) => (
                                    <div key={c.id} className="text-sm bg-gray-100 rounded p-2">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <p className="font-medium">{c.teamName}</p>
                                                {editingCommentId === c.id ? (
                                                    <>
                                                        <textarea
                                                            rows={2}
                                                            className="w-full border rounded px-3 py-1 text-sm"
                                                            value={editingContent}
                                                            onChange={(e) => setEditingContent(e.target.value)}
                                                        />
                                                        <div className="flex gap-2 mt-1">
                                                            <button
                                                                onClick={() => handleUpdateComment(c.id)}
                                                                className="text-sm text-white bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingCommentId(null)}
                                                                className="text-sm text-gray-600 hover:underline"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-700">{c.content}</p>
                                                )}
                                                <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</p>
                                            </div>


                                            {c.teamId === teamId && editingCommentId !== c.id && (
                                                <div className="flex gap-2 text-xl ml-2">
                                                    <button
                                                        title="Edit"
                                                        onClick={() => {
                                                            setEditingCommentId(c.id);
                                                            setEditingContent(c.content);
                                                        }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button title="Delete" onClick={() => handleDeleteComment(c.id)} className="text-red-500">
                                                        🗑️
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                ))
                            )}
                            {teamId && (
                                <div className="flex items-start gap-2 mt-2">
                                    <textarea
                                        rows={2}
                                        className="w-full border rounded px-3 py-1 text-sm"
                                        placeholder="Add a comment..."
                                        value={commentInputs[post.id] || ""}
                                        onChange={(e) =>
                                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                                        }
                                    />
                                    <button
                                        onClick={() => handleCommentSubmit(post.id)}
                                        disabled={commentSubmitting[post.id]}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-semibold"
                                    >
                                        {commentSubmitting[post.id] ? "Posting..." : "Post"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4 relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500 hover:text-black text-2xl"
                            onClick={() => setShowModal(false)}
                        >
                            &times;
                        </button>
                        <h2 className="text-xl font-bold">
                            {editingPost ? "Edit Post" : "Create a New Post"}
                        </h2>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Post Title"
                            className="w-full border rounded px-3 py-2"
                        />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your message..."
                            rows={5}
                            className="w-full border rounded px-3 py-2"
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded font-bold"
                        >
                            {submitting ? "Submitting..." : editingPost ? "Update" : "Post"}
                        </button>
                    </div>
                </div>
            )}

            {postToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm space-y-4 text-center relative">
                        <h2 className="text-xl font-bold text-gray-800">Delete Post</h2>
                        <p className="text-gray-700">
                            Are you sure you want to delete{" "}
                            <strong>"{postToDelete.title}"</strong>?
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setPostToDelete(null)}
                                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-bold"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ForumPosts;
