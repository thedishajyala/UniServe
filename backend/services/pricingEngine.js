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
    // Flat pricing: ₹49 for everyone, everywhere
    return { price: 49, commission: 0, delivery_earning: 49 };
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
