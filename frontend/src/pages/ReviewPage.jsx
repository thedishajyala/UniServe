import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { addReview } from '../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function ReviewPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    const handleSubmit = async () => {
        if (!rating) { toast.error('Please select a rating'); return; }
        setLoading(true);
        try {
            await addReview({ order_id: orderId, rating, review_text: text });
            setDone(true);
            toast.success('Review submitted! 🙏');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    if (done) return (
        <div className="full-center" style={{ flexDirection: 'column', gap: 20, padding: 32 }}>
            <div style={{ fontSize: 80 }}>🎉</div>
            <h2 style={{ textAlign: 'center' }}>Thanks for your review!</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', fontSize: 15 }}>
                Your feedback helps keep UniServe community trustworthy 💪
            </p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
                🏠 Back to Home
            </button>
        </div>
    );

    const REVIEW_LABELS = ['', 'Terrible 😠', 'Bad 😞', 'Okay 😐', 'Good 😊', 'Excellent 🔥'];
    const QUICK_TEXTS = ['Super fast delivery!', 'Very reliable 👍', 'Friendly and punctual', 'Delivered on time'];

    return (
        <div className="page">
            <div className="page-header">
                <button className="btn btn-icon btn-ghost" onClick={() => navigate('/')}><ArrowLeft size={20} /></button>
                <h1 className="page-title">Rate your experience</h1>
            </div>

            <div className="page-content">
                <div className="card slide-up" style={{ textAlign: 'center', padding: 32, marginBottom: 16 }}>
                    <p style={{ fontSize: 54, marginBottom: 8 }}>⭐</p>
                    <h2 style={{ marginBottom: 8 }}>How was your delivery?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 32 }}>
                        Your rating helps others choose the best delivery partners
                    </p>

                    {/* Stars */}
                    <div className="star-rating" style={{ justifyContent: 'center', marginBottom: 12 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s}
                                className={`star ${s <= (hover || rating) ? 'active' : ''}`}
                                style={{ fontSize: 44 }}
                                onClick={() => setRating(s)}
                                onMouseEnter={() => setHover(s)}
                                onMouseLeave={() => setHover(0)}>
                                ★
                            </span>
                        ))}
                    </div>

                    {(hover || rating) > 0 && (
                        <p style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 18, color: rating > 0 ? '#F59E0B' : 'var(--text-muted)', marginBottom: 24 }}>
                            {REVIEW_LABELS[hover || rating]}
                        </p>
                    )}
                </div>

                {/* Quick review chips */}
                {rating > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>QUICK TAGS</p>
                        <div className="chip-group">
                            {QUICK_TEXTS.map((t) => (
                                <button key={t}
                                    className={`chip ${text === t ? 'selected' : ''}`}
                                    onClick={() => setText(t === text ? '' : t)}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Text review */}
                <div className="input-group" style={{ marginBottom: 20 }}>
                    <label className="input-label">Write a review <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                    <textarea className="input" placeholder="Share your experience..." value={text} onChange={(e) => setText(e.target.value)}
                        style={{ minHeight: 100, resize: 'vertical' }} />
                </div>

                <button className="btn btn-primary btn-w-full btn-lg" onClick={handleSubmit} disabled={loading || !rating}>
                    {loading ? '⏳ Submitting...' : '⭐ Submit Review'}
                </button>

                <button className="btn btn-ghost btn-w-full" style={{ marginTop: 12 }} onClick={() => navigate('/')}>
                    Skip for now
                </button>
            </div>
        </div>
    );
}
