// import React, { useEffect, useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { getEarnings, getMyDeliveries, getDemandAnalytics } from '../services/api';
// import toast from 'react-hot-toast';
// import { Home, TrendingUp, User, Globe, Activity, Star } from 'lucide-react';

// export default function EarningsPage() {
//     const { user, logoutUser } = useAuth();
//     const navigate = useNavigate();
//     const [earnings, setEarnings] = useState(null);
//     const [deliveries, setDeliveries] = useState([]);
//     const [demand, setDemand] = useState(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const load = async () => {
//             try {
//                 const [eRes, dRes, analyticsRes] = await Promise.all([
//                     getEarnings(), getMyDeliveries(), getDemandAnalytics()
//                 ]);
//                 setEarnings(eRes.data);
//                 setDeliveries(dRes.data.slice(0, 10));
//                 setDemand(analyticsRes.data);
//             } catch {
//                 toast.error('Failed to load earnings');
//             } finally {
//                 setLoading(false);
//             }
//         };
//         load();
//     }, []);



//     const formatTime = (h) => {
//         const period = h >= 12 ? 'PM' : 'AM';
//         const hour = h % 12 || 12;
//         return `${hour} ${period}`;
//     };

//     return (
//         <div className="page" style={{ paddingBottom: 80 }}>
//             {/* Header */}
//             <div className="gradient-hero" style={{ padding: '40px 24px 80px', textAlign: 'left', overflow: 'hidden', position: 'relative', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}>
//                 <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
//                 <h1 style={{ color: 'white', fontSize: 26, marginBottom: 4 }}>Your Earnings 💸</h1>
//                 <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Track your delivery income</p>
//             </div>

//             <div className="page-content" style={{ marginTop: -48,marginBottom: 80, position: 'relative', zIndex: 2 }}>
//                 {/* Demand Alert */}
//                 {demand?.isCurrentlyPeak && (
//                     <div className="demand-banner fade-in" style={{ marginBottom: 40 }}>
//                         <span style={{ fontSize: 24 }}>🔥</span>
//                         <p style={{ fontSize: 14 }}>{demand.demandMessage}</p>
//                     </div>
//                 )}
                
//                 {/* DAILY GOAL HUD */}
//                 {/* <div className="card fade-in" style={{ padding: 24, marginBottom: 20, background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', color: 'white', border: 'none', position: 'relative', overflow: 'hidden' }}>
//                     <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, background: 'rgba(79, 70, 229, 0.1)', borderRadius: '50%' }} />
//                     <div style={{ position: 'relative', zIndex: 1 }}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
//                             <div>
//                                 <p style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Daily Goal</p>
//                                 <h2 style={{ fontSize: 28, fontWeight: 900 }}>₹{earnings?.today_earnings || 0} <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>/ ₹500</span></h2>
//                             </div>
//                             <div style={{ textAlign: 'right' }}>
//                                 <p style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>{Math.min(100, Math.round(((earnings?.today_earnings || 0) / 500) * 100))}%</p>
//                             </div>
//                         </div>
//                         <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
//                             <div style={{ 
//                                 height: '100%', 
//                                 width: `${Math.min(100, ((earnings?.today_earnings || 0) / 500) * 100)}%`, 
//                                 background: 'linear-gradient(90deg, #4F46E5 0%, #10B981 100%)',
//                                 borderRadius: 4,
//                                 transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
//                             }} />
//                         </div>
//                         <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 12, fontWeight: 500 }}>
//                             {earnings?.today_earnings >= 500 ? "Amazing! You've hit your goal! 🎉" : `Just ₹${500 - (earnings?.today_earnings || 0)} more to reach your daily target.`}
//                         </p>
//                     </div>
//                 </div> */}
//                 <div
//   className="card fade-in"
//   style={{
//     padding: 24,
//     marginTop: -20,
//     marginBottom: 20,
//     background: "linear-gradient(135deg, #312E81 0%, #1E1B4B 50%, #0F172A 100%)",
//     color: "white",
//     border: "1px solid rgba(255,255,255,0.08)",
//     borderRadius: 20,
//     position: "relative",
//     overflow: "hidden",
//     boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
//   }}
// >
//   {/* Glow Circles */}
//   <div
//     style={{
//       position: "absolute",
//       top: -20,
//       right: -20,
//       width: 120,
//       height: 120,
//       background: "rgba(99,102,241,0.25)",
//       borderRadius: "50%",
//       filter: "blur(20px)",
//     }}
//   />
//   <div
//     style={{
//       position: "absolute",
//       bottom: -30,
//       left: -30,
//       width: 140,
//       height: 140,
//       background: "rgba(16,185,129,0.18)",
//       borderRadius: "50%",
//       filter: "blur(25px)",
//     }}
//   />

//   <div style={{ position: "relative", zIndex: 1 }}>
//     {/* Top Row */}
//     <div
//       style={{
//         display: "flex",
//         justifyContent: "space-between",
//         alignItems: "flex-end",
//         marginBottom: 18,
//       }}
//     >
//       <div>
//         <p
//           style={{
//             fontSize: 12,
//             fontWeight: 800,
//             color: "rgba(255,255,255,0.7)",
//             textTransform: "uppercase",
//             letterSpacing: "0.12em",
//             marginBottom: 6,
//           }}
//         >
//           Daily Goal
//         </p>

//         <h2
//           style={{
//             fontSize: 32,
//             fontWeight: 900,
//             color: "#FFFFFF",
//             margin: 0,
//           }}
//         >
//           ₹{earnings?.today_earnings || 0}
//           <span
//             style={{
//               fontSize: 15,
//               fontWeight: 600,
//               color: "rgba(255,255,255,0.65)",
//               marginLeft: 6,
//             }}
//           >
//             / ₹500
//           </span>
//         </h2>
//       </div>

//       <div style={{ textAlign: "right" }}>
//         <p
//           style={{
//             fontSize: 18,
//             fontWeight: 900,
//             color: "#34D399",
//             margin: 0,
//           }}
//         >
//           {Math.min(
//             100,
//             Math.round(((earnings?.today_earnings || 0) / 500) * 100)
//           )}
//           %
//         </p>
//       </div>
//     </div>

//     {/* Progress Bar */}
//     <div
//       style={{
//         height: 10,
//         background: "rgba(255,255,255,0.12)",
//         borderRadius: 999,
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           height: "100%",
//           width: `${Math.min(
//             100,
//             ((earnings?.today_earnings || 0) / 500) * 100
//           )}%`,
//           background:
//             "linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #10B981 100%)",
//           borderRadius: 999,
//           transition: "width 1s ease",
//           boxShadow: "0 0 10px rgba(16,185,129,0.6)",
//         }}
//       />
//     </div>

//     {/* Bottom Text */}
//     <p
//       style={{
//         fontSize: 13,
//         color: "rgba(255,255,255,0.82)",
//         marginTop: 14,
//         fontWeight: 600,
//         lineHeight: 1.5,
//       }}
//     >
//       {earnings?.today_earnings >= 500
//         ? "Amazing! You've hit your goal! 🎉"
//         : `Just ₹${500 - (earnings?.today_earnings || 0)} more to reach your daily target.`}
//     </p>
//   </div>
// </div>

//                 {/* Stats */}
//                 <div className="stat-grid" style={{ marginBottom: 16 }}>
//                     <div className="stat-card">
//                         <div className="stat-value">₹{earnings?.today_earnings || 0}</div>
//                         <div className="stat-label">Today</div>
//                     </div>
//                     <div className="stat-card">
//                         <div className="stat-value">₹{earnings?.week_earnings || 0}</div>
//                         <div className="stat-label">This Week</div>
//                     </div>
//                     <div className="stat-card">
//                         <div className="stat-value">₹{earnings?.total_earnings || 0}</div>
//                         <div className="stat-label">Total Earned</div>
//                     </div>
//                     <div className="stat-card">
//                         <div className="stat-value">{earnings?.successful_deliveries || 0}</div>
//                         <div className="stat-label">Deliveries</div>
//                     </div>
//                 </div>

//                 {/* Experience & Activity */}
//                 <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 16 }}>
//                     <div className="card" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
//                         <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
//                             {[1,2,3,4,5].map(s => <Star key={s} size={16} fill={s <= Math.round(earnings?.rating || 5) ? "#F59E0B" : "none"} color="#F59E0B" />)}
//                         </div>
//                         <p style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 32, color: '#F59E0B', lineHeight: 1 }}>
//                             {(earnings?.rating || user?.rating || 5.0).toFixed(1)}
//                         </p>
//                         <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4, fontWeight: 600 }}>Partner Rating</p>
//                     </div>

//                     <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
//                         <Activity size={24} color="var(--primary)" style={{ marginBottom: 8 }} />
//                         <p style={{ fontWeight: 700, fontSize: 14 }}>Accept Rate</p>
//                         <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>98%</p>
//                     </div>
//                 </div>

//                 {/* Peak Hours */}
//                 {demand?.peakHours?.length > 0 && (
//                     <div style={{ marginBottom: 16 }}>
//                         <p className="section-title" style={{ marginBottom: 12 }}>📊 Peak Hours (Go Online to Earn More!)</p>
//                         <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
//                             {demand.peakHours.map((ph) => (
//                                 <div key={ph.hour} style={{ background: 'white', borderRadius: 12, padding: '12px 14px', textAlign: 'center', minWidth: 60, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
//                                     <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{ph.count}</p>
//                                     <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{formatTime(ph.hour)}</p>
//                                 </div>
//                             ))}
//                         </div>
//                     </div>
//                 )}

//                 {/* Delivery History */}
//                 <div>
//                     <p className="section-title" style={{ marginBottom: 12 }}>📦 Recent Deliveries</p>
//                     {deliveries.length === 0 ? (
//                         <div className="empty-state">
//                             <div className="empty-state-icon">🚴</div>
//                             <p className="empty-state-title">No deliveries yet</p>
//                             <p className="empty-state-sub">Go online to start earning!</p>
//                         </div>
//                     ) : (
//                         deliveries.map((d) => (
//                             <div key={d._id} className="order-card">
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                     <div>
//                                         <p style={{ fontWeight: 600, fontSize: 14 }}>{d.pickup_location}</p>
//                                         <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
//                                             → {d.delivery_hostel} · {new Date(d.createdAt).toLocaleDateString()}
//                                         </p>
//                                     </div>
//                                     <div style={{ textAlign: 'right' }}>
//                                         <p style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--success)', fontSize: 17 }}>+₹{d.delivery_earning}</p>
//                                         <span className={`badge status-${d.status}`} style={{ fontSize: 10, padding: '2px 8px' }}>{d.status}</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         ))
//                     )}
//                 </div>
//             </div>

//             {/* Bottom Nav */}
//             <nav className="bottom-nav">
//                 <Link to="/" className="nav-item">
//                     <div className="nav-icon-wrapper"><Home size={20} /></div>
//                     <span className="nav-label">Home</span>
//                 </Link>
//                 <Link to="/earnings" className="nav-item active">
//                     <div className="nav-icon-wrapper active-pill"><TrendingUp size={20} /></div>
//                     <span className="nav-label">Earnings</span>
//                 </Link>
//                 <Link to="/profile" className="nav-item">
//                     <div className="nav-icon-wrapper"><User size={20} /></div>
//                     <span className="nav-label">Profile</span>
//                 </Link>
//             </nav>
//         </div>
//     );
// }
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getEarnings,
  getMyDeliveries,
  getDemandAnalytics,
} from '../services/api';
import toast from 'react-hot-toast';
import { Home, TrendingUp, User, Activity, Star } from 'lucide-react';

export default function EarningsPage() {
  const { user } = useAuth();

  const [earnings, setEarnings] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [demand, setDemand] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [eRes, dRes, analyticsRes] = await Promise.all([
          getEarnings(),
          getMyDeliveries(),
          getDemandAnalytics(),
        ]);

        setEarnings(eRes.data);
        setDeliveries(dRes.data.slice(0, 10));
        setDemand(analyticsRes.data);
      } catch {
        toast.error('Failed to load earnings');
      }
    };

    load();
  }, []);

  const formatTime = (h) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour} ${period}`;
  };

  const today = earnings?.today_earnings || 0;
  const progress = Math.min(100, Math.round((today / 500) * 100));

  return (
    <div className="page" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div
        className="gradient-hero"
        style={{
          padding: '40px 24px 80px',
          textAlign: 'left',
          overflow: 'hidden',
          position: 'relative',
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.07)',
          }}
        />

        <h1 style={{ color: 'white', fontSize: 26, marginBottom: 4 }}>
          Your Earnings 💸
        </h1>

        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
          Track your delivery income
        </p>
      </div>

      <div
        className="page-content"
        style={{
          marginTop: -48,
          marginBottom: 80,
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* IMPROVED PEAK ALERT */}
        {demand?.isCurrentlyPeak && (
          <div
            className="fade-in"
            style={{
              marginBottom: 22,
              padding: '16px 18px',
              borderRadius: 18,
              background:
                'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 40%, #F59E0B 100%)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px rgba(245,158,11,0.18)',
              border: '1px solid rgba(255,255,255,0.45)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -20,
                right: -20,
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)',
                filter: 'blur(12px)',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                position: 'relative',
                zIndex: 2,
              }}
            >
              <div
                style={{
                  minWidth: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                }}
              >
                🔥
              </div>

              <div style={{ flex: 1 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#92400E',
                  }}
                >
                  Peak Time Live
                </p>

                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#78350F',
                    lineHeight: 1.45,
                  }}
                >
                  {demand.demandMessage}
                </p>
              </div>

              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.25)',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#7C2D12',
                }}
              >
                HIGH DEMAND
              </div>
            </div>
          </div>
        )}

        {/* DAILY GOAL */}
        <div
          className="card fade-in"
          style={{
            padding: 24,
            marginBottom: 20,
            background:
              'linear-gradient(135deg, #312E81 0%, #1E1B4B 50%, #0F172A 100%)',
            color: 'white',
            borderRadius: 20,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              background: 'rgba(99,102,241,0.25)',
              borderRadius: '50%',
              filter: 'blur(20px)',
            }}
          />

          <div
            style={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 140,
              height: 140,
              background: 'rgba(16,185,129,0.18)',
              borderRadius: '50%',
              filter: 'blur(25px)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.7)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Daily Goal
                </p>

                <h2 style={{ fontSize: 32, fontWeight: 900, margin: 0, color: 'white'}}>
                  ₹{today}
                  <span
                    style={{
                      fontSize: 15,
                      color: 'rgba(255,255,255,0.65)',
                      marginLeft: 6,
                    }}
                  >
                    / ₹500
                  </span>
                </h2>
              </div>

              <p
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#34D399',
                  margin: 0,
                }}
              >
                {progress}%
              </p>
            </div>

            <div
              style={{
                height: 10,
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 999,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background:
                    'linear-gradient(90deg,#6366F1 0%,#8B5CF6 50%,#10B981 100%)',
                  borderRadius: 999,
                }}
              />
            </div>

            <p
              style={{
                fontSize: 13,
                marginTop: 14,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.82)',
              }}
            >
              {today >= 500
                ? "Amazing! You've hit your goal! 🎉"
                : `Just ₹${500 - today} more to reach your daily target.`}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-value">₹{today}</div>
            <div className="stat-label">Today</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">₹{earnings?.week_earnings || 0}</div>
            <div className="stat-label">This Week</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">₹{earnings?.total_earnings || 0}</div>
            <div className="stat-label">Total Earned</div>
          </div>

          <div className="stat-card">
            <div className="stat-value">
              {earnings?.successful_deliveries || 0}
            </div>
            <div className="stat-label">Deliveries</div>
          </div>
        </div>

        {/* Rating + Activity */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div
            className="card"
            style={{
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  fill={
                    s <= Math.round(earnings?.rating || 5)
                      ? '#F59E0B'
                      : 'none'
                  }
                  color="#F59E0B"
                />
              ))}
            </div>

            <p
              style={{
                fontWeight: 800,
                fontSize: 32,
                color: '#F59E0B',
                margin: 0,
              }}
            >
              {(earnings?.rating || user?.rating || 5).toFixed(1)}
            </p>

            <p style={{ fontSize: 13, marginTop: 4 }}>Partner Rating</p>
          </div>

          <div
            className="card"
            style={{
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Activity size={24} color="var(--primary)" />
            <p style={{ fontWeight: 700, fontSize: 14, marginTop: 8 }}>
              Accept Rate
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: 'var(--primary)',
              }}
            >
              98%
            </p>
          </div>
        </div>

        {/* Peak Hours */}
        {demand?.peakHours?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p className="section-title" style={{ marginBottom: 12 }}>
              📊 Peak Hours (Go Online to Earn More!)
            </p>

            <div
              style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
              }}
            >
              {demand.peakHours.map((ph) => (
                <div
                  key={ph.hour}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: '12px 14px',
                    textAlign: 'center',
                    minWidth: 60,
                    border: '1px solid var(--border)',
                  }}
                >
                  <p
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      color: 'var(--primary)',
                      margin: 0,
                    }}
                  >
                    {ph.count}
                  </p>

                  <p style={{ fontSize: 10, marginTop: 2 }}>
                    {formatTime(ph.hour)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliveries */}
        <div>
          <p className="section-title" style={{ marginBottom: 12 }}>
            📦 Recent Deliveries
          </p>

          {deliveries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚴</div>
              <p className="empty-state-title">No deliveries yet</p>
              <p className="empty-state-sub">Go online to start earning!</p>
            </div>
          ) : (
            deliveries.map((d) => (
              <div key={d._id} className="order-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>
                      {d.pickup_location}
                    </p>

                    <p style={{ fontSize: 12, marginTop: 3 }}>
                      → {d.delivery_hostel} ·{' '}
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p
                      style={{
                        fontWeight: 800,
                        color: 'var(--success)',
                        fontSize: 17,
                      }}
                    >
                      +₹{d.delivery_earning}
                    </p>

                    <span
                      className={`badge status-${d.status}`}
                      style={{ fontSize: 10, padding: '2px 8px' }}
                    >
                      {d.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <div className="nav-icon-wrapper">
            <Home size={20} />
          </div>
          <span className="nav-label">Home</span>
        </Link>

        <Link to="/earnings" className="nav-item active">
          <div className="nav-icon-wrapper active-pill">
            <TrendingUp size={20} />
          </div>
          <span className="nav-label">Earnings</span>
        </Link>

        <Link to="/profile" className="nav-item">
          <div className="nav-icon-wrapper">
            <User size={20} />
          </div>
          <span className="nav-label">Profile</span>
        </Link>
      </nav>
    </div>
  );
}