export const calculateNightlyPrice = (accommodationType, seasonMultiplier, numberOfAdults, numberOfChildren, childrenAges) => {
  let basePrice = 0;
  if (accommodationType === 'Standard') basePrice = 80;
  else if (accommodationType === 'Deluxe') basePrice = 120;
  else if (accommodationType === 'Suite') basePrice = 180;

  const adultSurcharge = Math.max(0, numberOfAdults - 2) * 20;
  
  let childSurcharge = 0;
  if (childrenAges && childrenAges.length > 0) {
    childrenAges.forEach(age => {
      if (age >= 5 && age <= 12) {
        childSurcharge += 5;
      } else if (age > 12) {
        childSurcharge += 10;
      }
    });
  }

  const totalNightly = (basePrice + adultSurcharge + childSurcharge) * seasonMultiplier;
  
  return {
    basePrice,
    adultSurcharge,
    childSurcharge,
    totalNightly
  };
};

export const calculateTotalPrice = (nightlyPrice, numberOfNights) => {
  return nightlyPrice * numberOfNights;
};

export const getSeasonMultiplier = (checkInDate, checkOutDate, seasons) => {
  // Simplified for this task: return 1.0 if no seasons match or provided
  if (!seasons || seasons.length === 0) return 1.0;
  
  const checkIn = new Date(checkInDate);
  const checkInStr = checkIn.toISOString().split('T')[0];
  
  const matchedSeason = seasons.find(season => {
    return checkInStr >= season.start_date.split('T')[0] && checkInStr <= season.end_date.split('T')[0];
  });
  
  return matchedSeason ? matchedSeason.pricing_multiplier : 1.0;
};

export const formatPriceBreakdown = (accommodationType, basePrice, adultCosts, childCosts, seasonMultiplier, numberOfNights, totalPrice) => {
  return {
    accommodationType,
    basePrice,
    adultCosts,
    childCosts,
    seasonMultiplier,
    numberOfNights,
    totalPrice
  };
};