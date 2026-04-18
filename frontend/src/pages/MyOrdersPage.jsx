import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/api';
import { Home, TrendingUp, User, X } from 'lucide-react';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await getMyOrders();
      setOrders(res.data || []);
    } catch (error) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();

    if (s === 'delivered')
      return { bg: '#DCFCE7', text: '#16A34A' };

    if (s === 'pending')
      return { bg: '#FEF3C7', text: '#D97706' };

    if (s === 'accepted')
      return { bg: '#DBEAFE', text: '#2563EB' };

    if (s === 'cancelled')
      return { bg: '#FEE2E2', text: '#DC2626' };

    return { bg: '#EDE9FE', text: '#7C3AED' };
  };

  return (
    <div
      className="page"
      style={{
        minHeight: '100vh',
        background: '#F8FAFC'
      }}
    >
      {/* HEADER */}
      <div
        className="gradient-hero"
        style={{
          padding: '44px 24px 82px',
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30
        }}
      >
        <h1
          style={{
            color: 'white',
            fontSize: 28,
            fontWeight: 900
          }}
        >
          My Orders
        </h1>

        <p
          style={{
            color: 'rgba(255,255,255,.85)'
          }}
        >
          Tap any order to view details
        </p>
      </div>

      {/* BODY */}
      <div
        className="page-content"
        style={{
          marginTop: -48,
          paddingBottom: 120
        }}
      >
        {loading ? (
          <div className="card" style={{ padding: 20 }}>
            Loading...
          </div>
        ) : orders.length === 0 ? (
          <div className="card" style={{ padding: 20 }}>
            No orders found
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            {orders.map((item) => {
              const statusStyle = getStatusStyle(
                item.status
              );

              return (
                <div
                  key={item._id}
                  onClick={() =>
                    setSelectedOrder(item)
                  }
                  className="card"
                  style={{
                    padding: 22,
                    borderRadius: 26,
                    cursor: 'pointer',
                    background:
                      'linear-gradient(145deg,#ffffff,#f8fafc)',
                    boxShadow:
                      '0 10px 24px rgba(0,0,0,.05)',
                    border:
                      '1px solid rgba(0,0,0,.04)'
                  }}
                >
                  {/* TOP */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems: 'center',
                      marginBottom: 14
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          marginBottom: 6
                        }}
                      >
                        {item.item_details}
                      </h3>

                      <p
                        style={{
                          color: '#64748B',
                          fontSize: 12
                        }}
                      >
                        #
                        {item._id
                          .slice(-6)
                          .toUpperCase()}
                      </p>
                    </div>

                    <div
                      style={{
                        background:
                          statusStyle.bg,
                        color:
                          statusStyle.text,
                        padding: '0 18px',
                        height: 42,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          'center',
                        borderRadius: 999,
                        fontWeight: 800,
                        fontSize: 12,
                        textTransform:
                          'uppercase',
                        minWidth: 130,
                        lineHeight: 1
                      }}
                    >
                      {item.status.replaceAll(
                        '_',
                        ' '
                      )}
                    </div>
                  </div>

                  {/* PICKUP */}
                  <div
                    style={{
                      fontSize: 15,
                      color: '#334155',
                      marginBottom: 20
                    }}
                  >
                    📍 {item.pickup_location}
                  </div>

                  {/* FOOT */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center'
                    }}
                  >
                    <div
                      style={{
                        color: '#16A34A',
                        fontWeight: 900,
                        fontSize: 20
                      }}
                    >
                      ₹{item.price}
                    </div>

                    <div
                      style={{
                        color: '#64748B',
                        fontSize: 13
                      }}
                    >
                      {new Date(
                        item.createdAt
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP */}
      {selectedOrder && (
        <div
          onClick={() =>
            setSelectedOrder(null)
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(0,0,0,.45)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 18,
            backdropFilter: 'blur(4px)',
            animation:
              'fadeOverlay .25s ease'
          }}
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: 430,
              background: 'white',
              borderRadius: 24,
              padding: 24,
              boxShadow:
                '0 25px 60px rgba(0,0,0,.18)',
              maxHeight: '85vh',
              overflowY: 'auto',
              animation:
                'popupSmooth .32s cubic-bezier(0.16,1,0.3,1)'
            }}
          >
            {/* TOP */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                marginBottom: 18
              }}
            >
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 900
                }}
              >
                Order Details
              </h2>

              <button
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border: 'none',
                  background:
                    '#F1F5F9',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* DETAILS */}
            <div
              style={{
                display: 'grid',
                gap: 12
              }}
            >
              <div
                className="card"
                style={{ padding: 14 }}
              >
                <strong>🛍 Item</strong>
                <p>
                  {
                    selectedOrder.item_details
                  }
                </p>
              </div>

              <div
                className="card"
                style={{ padding: 14 }}
              >
                <strong>
                  📍 Pickup
                </strong>
                <p>
                  {
                    selectedOrder.pickup_location
                  }
                </p>
              </div>

              <div
                className="card"
                style={{ padding: 14 }}
              >
                <strong>
                  🏠 Delivery
                </strong>
                <p>
                  {
                    selectedOrder.delivery_hostel
                  }{' '}
                  Room{' '}
                  {
                    selectedOrder.delivery_room
                  }
                </p>
              </div>

              <div
                className="card"
                style={{ padding: 14 }}
              >
                <strong>
                  💰 Price
                </strong>
                <p>
                  ₹
                  {
                    selectedOrder.price
                  }
                </p>
              </div>

              <div
                className="card"
                style={{ padding: 14 }}
              >
                <strong>
                  🕒 Ordered On
                </strong>
                <p>
                  {new Date(
                    selectedOrder.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                setSelectedOrder(null)
              }
              style={{
                marginTop: 18,
                width: '100%',
                padding: 14,
                borderRadius: 14,
                border: 'none',
                background:
                  'linear-gradient(135deg,#6366F1,#8B5CF6)',
                color: 'white',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>

          <style>
            {`
              @keyframes popupSmooth {
                0% {
                  opacity: 0;
                  transform: translateY(28px) scale(.92);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }

              @keyframes fadeOverlay {
                0% { opacity: 0; }
                100% { opacity: 1; }
              }
            `}
          </style>
        </div>
      )}

      {/* NAV */}
      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <Home size={20} />
          <span>Home</span>
        </Link>

        <Link
          to="/earnings"
          className="nav-item"
        >
          <TrendingUp size={20} />
          <span>Earnings</span>
        </Link>

        <Link
          to="/profile"
          className="nav-item"
        >
          <User size={20} />
          <span>Profile</span>
        </Link>
      </nav>
    </div>
  );
}