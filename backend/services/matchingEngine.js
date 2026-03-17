/**
 * AI Matching Engine
 * Scores and ranks available delivery partners for a given order.
 *
 * Score = (0.4 × rating) + (0.3 × proximity) + (0.2 × responseSpeed) + (0.1 × successRate)
 */

// Hostel block groupings for proximity scoring
const BOYS_HOSTELS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15'];
const GIRLS_HOSTELS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6'];

function getHostelBlock(hostel) {
    if (BOYS_HOSTELS.includes(hostel)) return 'boys';
    if (GIRLS_HOSTELS.includes(hostel)) return 'girls';
    return 'unknown';
}

/**
 * Calculate proximity score (0–1)
 * Exact same hostel = 1.0
 * Same block (both boys or both girls) = 0.6
 * Different block = 0.2
 */
function proximityScore(partnerHostel, deliveryHostel) {
    if (partnerHostel === deliveryHostel) return 1.0;
    const partnerBlock = getHostelBlock(partnerHostel);
    const deliveryBlock = getHostelBlock(deliveryHostel);
    if (partnerBlock === deliveryBlock && partnerBlock !== 'unknown') return 0.6;
    return 0.2;
}

/**
 * Normalize response time to a 0–1 score
 * Faster response = higher score
 * avg_response_time is in minutes (lower = better)
 */
function responseSpeedScore(avgResponseTime) {
    // Cap at 30 minutes max; anything slower = 0
    const capped = Math.min(avgResponseTime, 30);
    return 1 - capped / 30;
}

/**
 * Calculate success rate (0–1)
 */
function calcSuccessRate(totalDeliveries, successfulDeliveries) {
    if (totalDeliveries === 0) return 0.8; // neutral for new partners
    return successfulDeliveries / totalDeliveries;
}

/**
 * Normalize rating from 1–5 range to 0–1
 */
function normalizeRating(rating) {
    return (rating - 1) / 4;
}

/**
 * Score a single delivery partner
 * @param {Object} partner - User document
 * @param {string} deliveryHostel - The hostel where the order is to be delivered
 * @returns {number} Score between 0 and 1
 */
function scorePartner(partner, deliveryHostel) {
    const rScore = normalizeRating(partner.rating);
    const pScore = proximityScore(partner.hostel, deliveryHostel);
    const rsScore = responseSpeedScore(partner.avg_response_time);
    const srScore = calcSuccessRate(partner.total_deliveries, partner.successful_deliveries);

    const score = 0.4 * rScore + 0.3 * pScore + 0.2 * rsScore + 0.1 * srScore;
    return Math.round(score * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Rank a list of available delivery partners
 * @param {Array} partners - Array of User documents
 * @param {string} deliveryHostel - Delivery destination hostel
 * @returns {Array} Sorted array with score attached and bestMatch flag on top partner
 */
function rankPartners(partners, deliveryHostel) {
    const scored = partners.map((partner) => {
        const p = partner.toObject ? partner.toObject() : { ...partner };
        p.ai_score = scorePartner(partner, deliveryHostel);
        return p;
    });

    scored.sort((a, b) => b.ai_score - a.ai_score);

    if (scored.length > 0) {
        scored[0].best_match = true;
    }

    return scored;
}

module.exports = { rankPartners, scorePartner };
