const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

export const isDealActive = (deal, referenceDate = new Date()) => {
  if (!deal || deal.is_active !== true) {
    return false;
  }

  const startDate = deal.start_date
    ? new Date(deal.start_date)
    : null;

  const endDate = deal.end_date
    ? new Date(deal.end_date)
    : null;

  if (
    (startDate && Number.isNaN(startDate.getTime())) ||
    (endDate && Number.isNaN(endDate.getTime()))
  ) {
    return false;
  }

  if (startDate && referenceDate < startDate) {
    return false;
  }

  if (endDate && referenceDate > endDate) {
    return false;
  }

  return true;
};

export const normalizeDiscountPercent = (value) => {
  const percent = Number(value);

  if (!Number.isFinite(percent)) {
    return 0;
  }

  return Math.min(100, Math.max(0, percent));
};

export const calculateCombinedDealPrice = ({
  standardPrice,
  deal = null,
  rateType = 'flexible',
}) => {
  const normalizedStandardPrice = roundMoney(standardPrice);

  if (
    !Number.isFinite(normalizedStandardPrice) ||
    normalizedStandardPrice <= 0
  ) {
    return {
      standardPrice: 0,
      dealDiscountPercent: 0,
      dealDiscountAmount: 0,
      priceAfterDeal: 0,
      rateDiscountPercent: 0,
      rateDiscountAmount: 0,
      totalDiscountAmount: 0,
      finalPrice: 0,
      dealApplied: false,
    };
  }

  const dealApplied = isDealActive(deal);

  const dealDiscountPercent = dealApplied
    ? normalizeDiscountPercent(
        deal.discount_percentage,
      )
    : 0;

  const dealDiscountAmount = roundMoney(
    normalizedStandardPrice *
      (dealDiscountPercent / 100),
  );

  const priceAfterDeal = roundMoney(
    normalizedStandardPrice -
      dealDiscountAmount,
  );

  const rateDiscountPercent =
    rateType === 'non_refundable' ? 10 : 0;

  const rateDiscountAmount = roundMoney(
    priceAfterDeal *
      (rateDiscountPercent / 100),
  );

  const finalPrice = roundMoney(
    priceAfterDeal -
      rateDiscountAmount,
  );

  const totalDiscountAmount = roundMoney(
    dealDiscountAmount +
      rateDiscountAmount,
  );

  return {
    standardPrice: normalizedStandardPrice,

    dealApplied,
    dealId: dealApplied ? deal.id : null,
    dealTitle: dealApplied
      ? deal.title || 'Special Offer'
      : null,

    dealDiscountPercent,
    dealDiscountAmount,
    priceAfterDeal,

    rateDiscountPercent,
    rateDiscountAmount,

    totalDiscountAmount,
    finalPrice,
  };
};