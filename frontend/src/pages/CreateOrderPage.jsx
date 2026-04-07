import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, createPayment } from '../services/api';
import { OUTLETS, GATES, ALL_HOSTELS, getPricing } from '../config/campus';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

const STEPS = ['Pickup', 'Delivery', 'Confirm'];

export default function CreateOrderPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        pickup_type: '',
        pickup_location: '',
        delivery_hostel: '',
        delivery_room: '',
        item_details: '',
        is_prepaid: false,
        special_instructions: '',
    });

    const pricing = form.pickup_type && form.pickup_location
        ? getPricing(form.pickup_type, form.pickup_location)
        : null;

    const isGate3 = form.pickup_location === 'Gate 3';

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const setPickupType = (type) => {
        setForm((f) => ({ ...f, pickup_type: type, pickup_location: '' }));
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // Step 1: Create Razorpay Order on server
            const { data: rzpOrder } = await createPayment({
                pickup_type: form.pickup_type,
                pickup_location: form.pickup_location,
            });

            // Step 2: Configure Checkout
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: 'UniServe',
                description: `Express Delivery: ${form.pickup_location}`,
                image: '/favicon.svg',
                order_id: rzpOrder.id,
                handler: async (response) => {
                    // Step 3: Payment captured, finalize order
                    try {
                        const res = await createOrder({
                            ...form,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            is_prepaid: true, // Forcing true since payment was made
                        });
                        toast.success('Payment successful! Finding partners 🔍');
                        navigate(`/order/${res.data.order._id}/partners`);
                    } catch (err) {
                        toast.error('Payment verified, but order creation failed. Please contact support.');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone || '',
                },
                theme: { color: '#4F46E5' },
                modal: {
                    ondismiss: () => setLoading(false)
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to initialize payment');
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (form.payment_method === 'online') {
            handlePayment();
        } else {
            // Cash on Delivery flow
            setLoading(true);
            try {
                const res = await createOrder({
                    ...form,
                    is_prepaid: false, // In COD, item is usually not prepaid by requester
                    payment_status: 'cash_on_delivery'
                });
                toast.success('Order placed! Finding partners 🔍');
                navigate(`/order/${res.data.order._id}/partners`);
            } catch (err) {
                toast.error(err.response?.data?.message || 'Failed to place order');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="page" style={{ background: 'var(--bg)' }}>
            <div className="page-header">
                <button className="btn btn-icon btn-ghost" onClick={() => step === 0 ? navigate('/') : setStep(step - 1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1 className="page-title">Create Order</h1>
            </div>

            {/* Step indicator */}
            <div style={{ padding: '16px 16px 0', maxWidth: 480, margin: '0 auto', width: '100%' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    {STEPS.map((s, i) => (
                        <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ height: 4, borderRadius: 2, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
                            <span style={{ fontSize: 11, color: i <= step ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, fontFamily: 'Outfit, sans-serif' }}>{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="page-content" style={{ paddingTop: 0 }}>
                {/* STEP 0: PICKUP */}
                {step === 0 && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div>
                            <p className="section-title" style={{ marginBottom: 12 }}>Where to pick up from?</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[
                                    { key: 'outlet', label: '🍔 Food Outlet' },
                                    { key: 'gate', label: '🚪 Campus Gate' },
                                    { key: 'manual', label: '📍 Custom Location' },
                                ].map((opt) => (
                                    <button key={opt.key}
                                        style={{
                                            flex: 1, padding: '12px 8px', borderRadius: 12, border: `2px solid ${form.pickup_type === opt.key ? 'var(--primary)' : 'var(--border)'}`,
                                            background: form.pickup_type === opt.key ? 'rgba(79,70,229,0.08)' : 'white',
                                            color: form.pickup_type === opt.key ? 'var(--primary)' : 'var(--text-secondary)',
                                            fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => setPickupType(opt.key)}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {form.pickup_type === 'outlet' && (
                            <div className="input-group fade-in">
                                <label className="input-label">Select Outlet</label>
                                <select className="input" name="pickup_location" value={form.pickup_location} onChange={handleChange}>
                                    <option value="">Choose outlet...</option>
                                    {OUTLETS.map((o) => <option key={o} value={o}>{o}</option>)}
                                </select>
                            </div>
                        )}

                        {form.pickup_type === 'gate' && (
                            <div className="input-group fade-in">
                                <label className="input-label">Select Gate</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {GATES.map((g) => (
                                        <button key={g.value}
                                            style={{
                                                padding: '14px 18px', borderRadius: 12, border: `2px solid ${form.pickup_location === g.value ? 'var(--primary)' : 'var(--border)'}`,
                                                background: form.pickup_location === g.value ? 'rgba(79,70,229,0.08)' : 'white',
                                                textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                                            }}
                                            onClick={() => setForm((f) => ({ ...f, pickup_location: g.value }))}>
                                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: form.pickup_location === g.value ? 'var(--primary)' : 'var(--text-primary)' }}>
                                                🚪 {g.label}
                                            </span>
                                            {g.parcelOnly && <span className="badge badge-warning">Parcels Only</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {form.pickup_type === 'manual' && (
                            <div className="input-group fade-in">
                                <label className="input-label">Describe Location</label>
                                <input className="input" name="pickup_location" placeholder="e.g. Near Main Library, Behind SAC..." value={form.pickup_location} onChange={handleChange} />
                            </div>
                        )}

                        {isGate3 && (
                            <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 12, padding: 14, display: 'flex', gap: 10 }}>
                                <span style={{ fontSize: 20 }}>⚠️</span>
                                <p style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
                                    Gate 3 is for <strong>parcels only</strong>. No food orders allowed at this gate.
                                </p>
                            </div>
                        )}

                        {pricing && (
                            <div className="card" style={{ padding: 16, background: 'rgba(79,70,229,0.04)', border: '1px solid rgba(79,70,229,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16 }}>Delivery Fee</p>
                                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Partner earns ₹{pricing.partnerEarns}</p>
                                    </div>
                                    <span className="price-tag">₹{pricing.price}</span>
                                </div>
                            </div>
                        )}

                        <button className="btn btn-primary btn-w-full btn-lg"
                            onClick={() => setStep(1)}
                            disabled={!form.pickup_type || !form.pickup_location}>
                            Next: Delivery Details →
                        </button>
                    </div>
                )}

                {/* STEP 1: DELIVERY */}
                {step === 1 && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="input-group">
                            <label className="input-label">Delivery Hostel</label>
                            <select className="input" name="delivery_hostel" value={form.delivery_hostel} onChange={handleChange}>
                                <option value="">Select hostel</option>
                                <optgroup label="Boys Hostels">
                                    {ALL_HOSTELS.filter(h => h.startsWith('C')).map((h) => <option key={h} value={h}>{h} (Boys)</option>)}
                                </optgroup>
                                <optgroup label="Girls Hostels">
                                    {ALL_HOSTELS.filter(h => h.startsWith('D')).map((h) => <option key={h} value={h}>{h} (Girls)</option>)}
                                </optgroup>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Room Number</label>
                            <input className="input" name="delivery_room" placeholder="e.g. 205" value={form.delivery_room} onChange={handleChange} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Item Details</label>
                            <textarea className="input" name="item_details" placeholder="Describe what you need (e.g. 1x Chicken Burger, extra fries)" value={form.item_details} onChange={handleChange}
                                style={{ minHeight: 96, resize: 'vertical' }} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Special Instructions <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
                            <input className="input" name="special_instructions" placeholder="e.g. No spice please" value={form.special_instructions} onChange={handleChange} />
                        </div>

                        {/* Prepaid options (Item Status) */}
                        <div className="input-group">
                            <label className="input-label">Have you already paid for the item?</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn" style={{ flex: 1, padding: '12px', border: `2px solid ${form.is_prepaid ? 'var(--primary)' : 'var(--border)'}`, background: form.is_prepaid ? 'rgba(79,70,229,0.08)' : 'white' }} onClick={() => setForm(f => ({ ...f, is_prepaid: true }))}>✅ Paid @ Shop</button>
                                <button className="btn" style={{ flex: 1, padding: '12px', border: `2px solid ${!form.is_prepaid ? 'var(--primary)' : 'var(--border)'}`, background: !form.is_prepaid ? 'rgba(79,70,229,0.08)' : 'white' }} onClick={() => setForm(f => ({ ...f, is_prepaid: false }))}>💵 Cash @ Door</button>
                            </div>
                        </div>

                        <button className="btn btn-primary btn-w-full btn-lg"
                            onClick={() => setStep(2)}
                            disabled={!form.delivery_hostel || !form.delivery_room || !form.item_details}>
                            Next: Review & Pay →
                        </button>
                    </div>
                )}

                {/* STEP 2: CONFIRM + PAY */}
                {step === 2 && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="card" style={{ padding: 24 }}>
                            <h3 style={{ marginBottom: 18 }}>Order Summary</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>📍 Pickup</span>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{form.pickup_location}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>🏠 Deliver to</span>
                                    <span style={{ fontWeight: 600, fontSize: 14 }}>{form.delivery_hostel}, Room {form.delivery_room}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>🛍️ Items</span>
                                    <span style={{ fontWeight: 600, fontSize: 14, maxWidth: '55%', textAlign: 'right' }}>{form.item_details}</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700 }}>Delivery Fee</span>
                                    <span className="price-tag">₹{pricing?.price}</span>
                                </div>
                            </div>
                        </div>

                        {/* SELECT PAYMENT METHOD */}
                        <div className="input-group">
                            <label className="input-label">Pay Delivery Fee via</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className="btn" 
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, border: `2px solid ${form.payment_method === 'online' ? 'var(--primary)' : 'var(--border)'}`, background: form.payment_method === 'online' ? 'rgba(79,70,229,0.08)' : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                                    onClick={() => setForm(f => ({ ...f, payment_method: 'online' }))}>
                                    <span style={{ fontSize: 20 }}>💳</span>
                                    <span style={{ fontWeight: 700, fontSize: 12 }}>Pay Online</span>
                                </button>
                                <button className="btn" 
                                    disabled={form.pickup_type === 'outlet'}
                                    style={{ flex: 1, padding: '16px', borderRadius: 16, border: `2px solid ${form.payment_method === 'cash' ? 'var(--primary)' : 'var(--border)'}`, background: form.payment_method === 'cash' ? 'rgba(79,70,229,0.08)' : 'white', opacity: form.pickup_type === 'outlet' ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                                    onClick={() => setForm(f => ({ ...f, payment_method: 'cash' }))}>
                                    <span style={{ fontSize: 20 }}>💵</span>
                                    <span style={{ fontWeight: 700, fontSize: 12 }}>Cash on Delivery</span>
                                </button>
                            </div>
                            {form.pickup_type === 'outlet' && (
                                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>
                                    ⚠️ Online payment required for food orders.
                                </p>
                            )}
                        </div>

                        <button className="btn btn-primary btn-w-full btn-lg"
                            onClick={handleSubmit} disabled={loading}>
                            {loading ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div className="spinner-sm" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                form.payment_method === 'online' 
                                    ? `💳 Pay ₹${pricing?.price} & Find Partner` 
                                    : `🤝 Confirm Order & Find Partner`
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
