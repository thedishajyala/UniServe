/**
 * Pricing Engine
 * Calculates delivery fee, platform commission, and delivery partner earnings
 * based on pickup location type/name.
 */

const LOW_PRICE_OUTLETS = ['Tuck Shop BU', 'Maggie Hotspot'];
const ALL_OUTLETS = [
    'Kathi House',
    'Dominos',
    'Subway',
    'Southern Stories',
    'Maggie Hotspot',
    'SnapEats',
    'House of Chow',
    'Tuck Shop BU',
    'Quench',
];

const GATES = ['Gate 1', 'Gate 2', 'Gate 3'];

/**
 * Calculate price, commission, and delivery earning
 * @param {string} pickup_type - 'outlet' | 'gate' | 'manual'
 * @param {string} pickup_location - The specific location name
 * @returns {{ price: number, commission: number, delivery_earning: number }}
 */
function calculatePricing(pickup_type, pickup_location) {
    // Gate 3 = parcels only, ₹29
    if (pickup_type === 'gate' && pickup_location === 'Gate 3') {
        return { price: 29, commission: 4, delivery_earning: 25 };
    }

    // Tuck Shop BU or Maggie Hotspot = ₹29
    if (pickup_type === 'outlet' && LOW_PRICE_OUTLETS.includes(pickup_location)) {
        return { price: 29, commission: 4, delivery_earning: 25 };
    }

    // Gates 1 & 2 = ₹49 (food parcels usually)
    if (pickup_type === 'gate') {
        return { price: 49, commission: 9, delivery_earning: 40 };
    }

    // Other food outlets = ₹49
    if (pickup_type === 'outlet') {
        return { price: 49, commission: 9, delivery_earning: 40 };
    }

    // Manual location = ₹29
    return { price: 29, commission: 4, delivery_earning: 25 };
}

function validateGate3IsParcel(pickup_location, item_details) {
    // Gate 3 is parcel only — no restaurant items
    if (pickup_location === 'Gate 3') {
        return { valid: true, parcelOnly: true };
    }
    return { valid: true, parcelOnly: false };
}

module.exports = {
    calculatePricing,
    validateGate3IsParcel,
    ALL_OUTLETS,
    GATES,
    LOW_PRICE_OUTLETS,
};
