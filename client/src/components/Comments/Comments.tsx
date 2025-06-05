import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Comments.css";

interface Comment {
  _id: string;
  comment: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface CommentsProps {
  laptopId: string;
}

const Comments: React.FC<CommentsProps> = ({ laptopId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/comments/${laptopId}`
      );
      const data = await response.json();

      if (data.success) {
        setComments(data.comments || []);
      } else {
        setError("Failed to fetch comments");
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments");
    } finally {
      setLoading(false);
    }
  }, [laptopId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("Please log in to add a comment");
      return;
    }

    if (!newComment.trim()) {
      setError("Please enter a comment");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch("http://localhost:8080/api/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user: user.id,
          laptop: laptopId,
          comment: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewComment("");
        fetchComments(); // Refresh comments
      } else {
        setError(data.message || "Failed to add comment");
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Failed to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days !== 1 ? "s" : ""} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  if (loading) {
    return (
      <div className="comments-section">
        <h3>💬 User Comments</h3>
        <div className="comments-loading">
          <div className="loading-spinner"></div>
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comments-section">
      <h3>💬 User Comments ({comments.length})</h3>

      {/* Comment Form */}
      <div className="comment-form-container">
        {user ? (
          <form onSubmit={handleSubmitComment} className="comment-form">
            <div className="comment-input-section">
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="comment-input-wrapper">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this laptop..."
                  className="comment-input"
                  rows={3}
                  maxLength={500}
                  disabled={submitting}
                />
                <div className="comment-input-footer">
                  <span className="character-count">
                    {newComment.length}/500
                  </span>
                  <button
                    type="submit"
                    className="submit-comment-btn"
                    disabled={submitting || !newComment.trim()}
                  >
                    {submitting ? (
                      <>
                        <div className="btn-spinner"></div>
                        Posting...
                      </>
                    ) : (
                      "Post Comment"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="login-prompt">
            <p>
              Please <a href="/login">log in</a> to share your thoughts about
              this laptop.
            </p>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
      </div>

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <div className="no-comments-icon">💭</div>
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment-item">
              <div className="comment-header">
                <div className="comment-avatar">
                  {comment.user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="comment-meta">
                  <span className="comment-author">{comment.user.name}</span>
                  <span className="comment-time">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>
              <div className="comment-content">{comment.comment}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Comments;
