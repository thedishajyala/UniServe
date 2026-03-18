// Campus Configuration — all fixed locations for UniServe

export const OUTLETS = [
    'Kathi House',
    'Dominos',
    'Subway',
    'Southern Stories',
    'Maggie Hotspot',
    'SnapEats',
    'House of Chow',
    'Tuck Shop BU',
];

export const LOW_PRICE_OUTLETS = ['Tuck Shop BU', 'Maggie Hotspot'];

export const GATES = [
    { label: 'Gate 1', value: 'Gate 1', parcelOnly: false },
    { label: 'Gate 2', value: 'Gate 2', parcelOnly: false },
    { label: 'Gate 3 (Parcels Only)', value: 'Gate 3', parcelOnly: true },
];

export const BOYS_HOSTELS = [
    'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15',
];

export const GIRLS_HOSTELS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

export const ALL_HOSTELS = [...BOYS_HOSTELS, ...GIRLS_HOSTELS];

// Pricing
export const PRICING = {
    gate3: { price: 29, commission: 4, partnerEarns: 25 },
    lowOutlet: { price: 29, commission: 4, partnerEarns: 25 },
    standard: { price: 49, commission: 9, partnerEarns: 40 },
};

export function getPricing(pickupType, pickupLocation) {
    if (pickupType === 'gate' && pickupLocation === 'Gate 3') return PRICING.gate3;
    if (pickupType === 'outlet' && LOW_PRICE_OUTLETS.includes(pickupLocation)) return PRICING.lowOutlet;
    if (pickupType === 'gate') return PRICING.gate3;
    if (pickupType === 'outlet') return PRICING.standard;
    return PRICING.gate3; // manual = ₹29
}

export const UNIVERSITY_DOMAIN = 'bennett.edu.in';

export const ORDER_STATUSES = [
    { key: 'accepted', label: 'Accepted', icon: '✅' },
    { key: 'picked', label: 'Picked Up', icon: '📦' },
    { key: 'on_the_way', label: 'On the Way', icon: '🚗' },
    { key: 'delivered', label: 'Delivered', icon: '🎉' },
];
