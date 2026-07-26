import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { Helmet } from 'react-helmet';

import {
  AlertCircle,
  CalendarPlus as CalendarIcon,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Tag,
} from 'lucide-react';

import {
  addDays,
  differenceInDays,
  format,
} from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Calendar } from '@/components/ui/calendar';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { toast } from 'sonner';

import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

import {
  calculateNightlyPrice,
  calculateTotalPrice,
  getSeasonMultiplier,
} from '@/lib/PriceCalculator.js';

import {
  calculateCombinedDealPrice,
  isDealActive,
} from '@/lib/DealCalculator.js';

import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { cn } from '@/lib/utils';

const FLEXIBLE_POLICY_TEXT =
  'Free cancellation more than 30 days before arrival. A 50% charge applies from 30 days until 2 days before arrival. A 100% charge applies within 2 days of arrival.';

const NON_REFUNDABLE_POLICY_TEXT =
  'This discounted rate is non-refundable. No refund is due if the booking is cancelled.';

const roundMoney = (value) =>
  Math.round(
    (Number(value) + Number.EPSILON) * 100,
  ) / 100;

export default function BookingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const today = new Date();
  const dealId = searchParams.get('deal');

  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] =
    useState(true);

  const [blockedDates, setBlockedDates] =
    useState([]);

  const [
    isCheckingAvailability,
    setIsCheckingAvailability,
  ] = useState(false);

  const [selectedDeal, setSelectedDeal] =
    useState(null);

  const [isLoadingDeal, setIsLoadingDeal] =
    useState(false);

  const [dealError, setDealError] =
    useState('');

  const [formData, setFormData] = useState({
    accommodationType: '',

    dateRange: {
      from: undefined,
      to: undefined,
    },

    numberOfAdults: 2,
    numberOfChildren: 0,
    childrenAges: [],
    rateType: 'flexible',
  });

  useEffect(() => {
    const fetchSelectedDeal = async () => {
      if (!dealId) {
        setSelectedDeal(null);
        setDealError('');
        return;
      }

      setIsLoadingDeal(true);
      setDealError('');

      try {
        const deal = await pb
          .collection('guest_deals')
          .getOne(dealId, {
            $autoCancel: false,
          });

        if (!isDealActive(deal)) {
          setSelectedDeal(null);

          setDealError(
            'This offer is no longer active. Standard rates are available.',
          );

          return;
        }

        setSelectedDeal(deal);
      } catch (error) {
        console.error(
          'Failed to load selected offer:',
          error,
        );

        setSelectedDeal(null);

        setDealError(
          'The selected offer could not be loaded. Standard rates are available.',
        );
      } finally {
        setIsLoadingDeal(false);
      }
    };

    fetchSelectedDeal();
  }, [dealId]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const records = await pb
          .collection('rooms')
          .getFullList({
            sort: 'name',
            $autoCancel: false,
          });

        setRooms(records);

        if (records.length > 0) {
          setFormData((previous) => ({
            ...previous,

            accommodationType:
              records[0].name,
          }));
        }
      } catch (error) {
        console.error(
          'Failed to fetch rooms:',
          error,
        );

        toast.error(
          'Failed to load available rooms.',
        );
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const selectedRoom = rooms.find(
    (room) =>
      room.name ===
      formData.accommodationType,
  );

  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (!selectedRoom?.id) {
        setBlockedDates([]);
        return;
      }

      try {
        const startStr = format(
          today,
          'yyyy-MM-dd',
        );

        const endStr = format(
          addDays(today, 365),
          'yyyy-MM-dd',
        );

        const response =
          await apiServerClient.fetch(
            `/room-availability/${selectedRoom.id}/check-availability?start_date=${startStr}&end_date=${endStr}`,
          );

        const data = await response.json();

        if (data.blocked_dates) {
          setBlockedDates(
            data.blocked_dates.map(
              (dateString) =>
                new Date(dateString),
            ),
          );
        } else {
          setBlockedDates([]);
        }
      } catch (error) {
        console.error(
          'Failed to fetch blocked dates:',
          error,
        );

        setBlockedDates([]);
      }
    };

    fetchBlockedDates();
  }, [selectedRoom?.id]);

  const handleChildCountChange = (
    count,
  ) => {
    const newCount = Math.max(
      0,
      parseInt(count, 10) || 0,
    );

    const newAges = [
      ...formData.childrenAges,
    ];

    if (newCount > newAges.length) {
      for (
        let index = newAges.length;
        index < newCount;
        index += 1
      ) {
        newAges.push(0);
      }
    } else if (
      newCount < newAges.length
    ) {
      newAges.length = newCount;
    }

    setFormData((previous) => ({
      ...previous,
      numberOfChildren: newCount,
      childrenAges: newAges,
    }));
  };

  const handleChildAgeChange = (
    index,
    age,
  ) => {
    const newAges = [
      ...formData.childrenAges,
    ];

    newAges[index] =
      parseInt(age, 10) || 0;

    setFormData((previous) => ({
      ...previous,
      childrenAges: newAges,
    }));
  };

  const pricePreview = useMemo(() => {
    const { from, to } =
      formData.dateRange;

    if (
      !from ||
      !to ||
      !formData.accommodationType
    ) {
      return null;
    }

    const nights = differenceInDays(
      to,
      from,
    );

    if (nights <= 0) {
      return null;
    }

    const checkInStr = format(
      from,
      'yyyy-MM-dd',
    );

    const checkOutStr = format(
      to,
      'yyyy-MM-dd',
    );

    const seasonMultiplier =
      getSeasonMultiplier(
        checkInStr,
        checkOutStr,
        [],
      );

    const nightlyCosts =
      calculateNightlyPrice(
        formData.accommodationType,
        seasonMultiplier,
        formData.numberOfAdults,
        formData.numberOfChildren,
        formData.childrenAges,
      );

    const standardTotalPrice =
      roundMoney(
        calculateTotalPrice(
          nightlyCosts.totalNightly,
          nights,
        ),
      );

    const flexiblePrice =
      calculateCombinedDealPrice({
        standardPrice:
          standardTotalPrice,

        deal: selectedDeal,
        rateType: 'flexible',
      });

    const nonRefundablePrice =
      calculateCombinedDealPrice({
        standardPrice:
          standardTotalPrice,

        deal: selectedDeal,
        rateType: 'non_refundable',
      });

    return {
      nights,
      seasonMultiplier,
      nightlyCosts,
      standardTotalPrice,
      flexiblePrice,
      nonRefundablePrice,
    };
  }, [
    formData.accommodationType,
    formData.childrenAges,
    formData.dateRange,
    formData.numberOfAdults,
    formData.numberOfChildren,
    selectedDeal,
  ]);

  const handleSubmit = async (
    event,
  ) => {
    event.preventDefault();

    if (
      !formData.dateRange.from ||
      !formData.dateRange.to
    ) {
      toast.error(
        'Please select check-in and check-out dates.',
      );

      return;
    }

    if (!selectedRoom?.id) {
      toast.error(
        'Please select a room type.',
      );

      return;
    }

    if (
      Number(
        selectedRoom.available_rooms,
      ) <= 0
    ) {
      toast.error(
        'Sorry, there are no rooms available for this type.',
      );

      return;
    }

    const checkInStr = format(
      formData.dateRange.from,
      'yyyy-MM-dd',
    );

    const checkOutStr = format(
      formData.dateRange.to,
      'yyyy-MM-dd',
    );

    setIsCheckingAvailability(true);

    try {
      const response =
        await apiServerClient.fetch(
          `/room-availability/${selectedRoom.id}/check-availability?start_date=${checkInStr}&end_date=${checkOutStr}`,
        );

      const availabilityData =
        await response.json();

      if (
        !response.ok ||
        !availabilityData.available
      ) {
        toast.error(
          `Dates unavailable: ${
            availabilityData.reason ||
            'The selected room is not available.'
          }`,
        );

        return;
      }
    } catch (error) {
      console.error(
        'Availability check error:',
        error,
      );

      toast.error(
        'Failed to verify availability. Please try again.',
      );

      return;
    } finally {
      setIsCheckingAvailability(false);
    }

    if (!pricePreview) {
      toast.error(
        'Unable to calculate the booking price.',
      );

      return;
    }

    const isNonRefundable =
      formData.rateType ===
      'non_refundable';

    const selectedPrice =
      isNonRefundable
        ? pricePreview.nonRefundablePrice
        : pricePreview.flexiblePrice;

    navigate('/booking/review', {
      state: {
        bookingData: {
          ...formData,

          checkInDate: checkInStr,
          checkOutDate: checkOutStr,

          roomId: selectedRoom.id,

          available_rooms:
            selectedRoom.available_rooms,

          dealId:
            selectedPrice.dealId,

          dealTitle:
            selectedPrice.dealTitle,

          dealDiscountPercent:
            selectedPrice.dealDiscountPercent,

          dealDiscountAmount:
            selectedPrice.dealDiscountAmount,

          dealApplied:
            selectedPrice.dealApplied,

          rateType:
            formData.rateType,

          rateLabel:
            isNonRefundable
              ? 'Non-refundable'
              : 'Flexible',

          isRefundable:
            !isNonRefundable,

          cancellationPolicyCode:
            isNonRefundable
              ? 'non_refundable'
              : 'flexible_30_days',

          cancellationPolicyText:
            isNonRefundable
              ? NON_REFUNDABLE_POLICY_TEXT
              : FLEXIBLE_POLICY_TEXT,
        },

        priceData: {
          ...pricePreview.nightlyCosts,

          seasonMultiplier:
            pricePreview.seasonMultiplier,

          nights:
            pricePreview.nights,

          standardTotalPrice:
            pricePreview.standardTotalPrice,

          dealDiscountPercent:
            selectedPrice.dealDiscountPercent,

          dealDiscountAmount:
            selectedPrice.dealDiscountAmount,

          priceAfterDeal:
            selectedPrice.priceAfterDeal,

          rateDiscountPercent:
            selectedPrice.rateDiscountPercent,

          rateDiscountAmount:
            selectedPrice.rateDiscountAmount,

          discountPercent:
            selectedPrice.rateDiscountPercent,

          discountAmount:
            selectedPrice.rateDiscountAmount,

          totalDiscountAmount:
            selectedPrice.totalDiscountAmount,

          totalPrice:
            selectedPrice.finalPrice,

          currency: 'EUR',
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          Book Your Stay | Raya Boutique
        </title>
      </Helmet>

      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-10 text-foreground text-center font-serif">
            Book Your Stay
          </h1>

          {isLoadingDeal && (
            <div className="mb-6 rounded-xl border border-border bg-card p-4 flex items-center">
              <Loader2 className="w-5 h-5 mr-3 animate-spin text-primary" />

              <span className="text-sm text-muted-foreground">
                Loading your selected
                offer...
              </span>
            </div>
          )}

          {selectedDeal && (
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-5">
              <div className="flex items-start gap-3">
                <Tag className="w-6 h-6 text-primary shrink-0 mt-0.5" />

                <div>
                  <p className="text-sm font-medium text-primary">
                    Selected Offer
                  </p>

                  <h2 className="text-xl font-semibold mt-1">
                    {selectedDeal.title}
                  </h2>

                  <p className="text-sm text-muted-foreground mt-2">
                    {Number(
                      selectedDeal.discount_percentage ||
                        0,
                    )}
                    % discount will be
                    applied to your stay.
                    It can be combined with
                    the 10% Non-refundable
                    discount.
                  </p>
                </div>
              </div>
            </div>
          )}

          {dealError && (
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 text-amber-600 shrink-0 mt-0.5" />

              <p className="text-sm">
                {dealError}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-8"
          >
            <div>
              <Label>
                Accommodation Type
              </Label>

              {isLoadingRooms ? (
                <div className="h-10 mt-2 flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading rooms...
                </div>
              ) : (
                <Select
                  value={
                    formData.accommodationType
                  }
                  onValueChange={(value) => {
                    setFormData(
                      (previous) => ({
                        ...previous,

                        accommodationType:
                          value,

                        dateRange: {
                          from: undefined,
                          to: undefined,
                        },
                      }),
                    );
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a room type" />
                  </SelectTrigger>

                  <SelectContent>
                    {rooms.map((room) => (
                      <SelectItem
                        key={room.id}
                        value={room.name}
                      >
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedRoom &&
                Number(
                  selectedRoom.available_rooms,
                ) > 0 &&
                Number(
                  selectedRoom.available_rooms,
                ) < 3 && (
                  <div className="mt-3 p-3 bg-warning/10 rounded-md text-sm flex items-center border border-warning/20">
                    <AlertCircle className="w-4 h-4 mr-2 text-warning" />

                    Only{' '}
                    {
                      selectedRoom.available_rooms
                    }{' '}
                    room
                    {Number(
                      selectedRoom.available_rooms,
                    ) > 1
                      ? 's'
                      : ''}{' '}
                    left!
                  </div>
                )}

              {selectedRoom &&
                Number(
                  selectedRoom.available_rooms,
                ) <= 0 && (
                  <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center border border-destructive/20">
                    <AlertCircle className="w-4 h-4 mr-2" />

                    Sold out. Please select
                    another room type.
                  </div>
                )}
            </div>

            <div className="space-y-2">
              <Label>Stay Dates</Label>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full h-12 justify-start text-left font-normal text-base',

                      !formData.dateRange
                        .from &&
                        'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-3 h-5 w-5 opacity-70" />

                    {formData.dateRange
                      .from ? (
                      formData.dateRange
                        .to ? (
                        <>
                          {format(
                            formData
                              .dateRange
                              .from,

                            'LLL dd, y',
                          )}{' '}
                          -{' '}
                          {format(
                            formData
                              .dateRange
                              .to,

                            'LLL dd, y',
                          )}
                        </>
                      ) : (
                        format(
                          formData
                            .dateRange
                            .from,

                          'LLL dd, y',
                        )
                      )
                    ) : (
                      <span>
                        Select check-in and
                        check-out dates
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>

                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                >
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={
                      formData.dateRange
                        .from || today
                    }
                    selected={
                      formData.dateRange
                    }
                    onSelect={(range) =>
                      setFormData(
                        (previous) => ({
                          ...previous,

                          dateRange:
                            range || {
                              from: undefined,
                              to: undefined,
                            },
                        }),
                      )
                    }
                    numberOfMonths={2}
                    disabled={[
                      {
                        before: today,
                      },

                      ...blockedDates,
                    ]}
                    modifiers={{
                      blocked:
                        blockedDates,
                    }}
                    modifiersClassNames={{
                      blocked:
                        'bg-destructive/20 text-destructive line-through',
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label>Adults</Label>

                <Input
                  type="number"
                  min={1}
                  max={6}
                  value={
                    formData.numberOfAdults
                  }
                  onChange={(event) =>
                    setFormData(
                      (previous) => ({
                        ...previous,

                        numberOfAdults:
                          parseInt(
                            event.target
                              .value,

                            10,
                          ) || 1,
                      }),
                    )
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Children</Label>

                <Input
                  type="number"
                  min={0}
                  max={4}
                  value={
                    formData.numberOfChildren
                  }
                  onChange={(event) =>
                    handleChildCountChange(
                      event.target.value,
                    )
                  }
                  className="mt-2"
                />
              </div>
            </div>

            {formData.numberOfChildren >
              0 && (
              <div className="p-5 bg-muted/30 rounded-xl space-y-4 border border-border/50">
                <Label className="font-semibold">
                  Children Ages
                </Label>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.childrenAges.map(
                    (age, index) => (
                      <div key={index}>
                        <Label className="text-xs">
                          Child{' '}
                          {index + 1}{' '}
                          Age
                        </Label>

                        <Input
                          type="number"
                          min={0}
                          max={17}
                          value={age}
                          onChange={(
                            event,
                          ) =>
                            handleChildAgeChange(
                              index,

                              event.target
                                .value,
                            )
                          }
                          className="mt-1"
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold">
                  Choose Your Rate
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Select the
                  cancellation conditions
                  that suit your plans.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormData(
                    (previous) => ({
                      ...previous,
                      rateType:
                        'flexible',
                    }),
                  )
                }
                className={cn(
                  'w-full text-left rounded-xl border p-5 transition',

                  formData.rateType ===
                    'flexible'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />

                      <h3 className="font-semibold text-lg">
                        Flexible Rate
                      </h3>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <p className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

                        100% refund more
                        than 30 days before
                        arrival.
                      </p>

                      <p className="flex gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />

                        50% refund from 30
                        days until 2 days
                        before arrival.
                      </p>

                      <p className="flex gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />

                        No refund within 2
                        days of arrival.
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">
                      Total
                    </div>

                    {pricePreview
                      ?.flexiblePrice
                      .dealApplied && (
                      <div className="text-sm text-muted-foreground line-through">
                        €
                        {pricePreview.standardTotalPrice.toFixed(
                          2,
                        )}
                      </div>
                    )}

                    <div className="text-xl font-bold text-primary">
                      {pricePreview
                        ? `€${pricePreview.flexiblePrice.finalPrice.toFixed(
                            2,
                          )}`
                        : 'Select dates'}
                    </div>

                    {pricePreview
                      ?.flexiblePrice
                      .dealApplied && (
                      <div className="text-xs text-emerald-700 mt-1">
                        Includes{' '}
                        {
                          pricePreview
                            .flexiblePrice
                            .dealDiscountPercent
                        }
                        % offer discount
                      </div>
                    )}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData(
                    (previous) => ({
                      ...previous,

                      rateType:
                        'non_refundable',
                    }),
                  )
                }
                className={cn(
                  'w-full text-left rounded-xl border p-5 transition',

                  formData.rateType ===
                    'non_refundable'
                    ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-primary" />

                      <h3 className="font-semibold text-lg">
                        Non-refundable
                      </h3>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">
                      Save an additional
                      10%. This rate cannot
                      be refunded if the
                      booking is cancelled.
                    </p>

                    {selectedDeal && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        The offer discount
                        and Non-refundable
                        discount are
                        combined.
                      </p>
                    )}

                    {pricePreview && (
                      <p className="mt-3 text-sm font-medium text-emerald-700">
                        You save €
                        {pricePreview.nonRefundablePrice.totalDiscountAmount.toFixed(
                          2,
                        )}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    {pricePreview && (
                      <div className="text-sm text-muted-foreground line-through">
                        €
                        {pricePreview.standardTotalPrice.toFixed(
                          2,
                        )}
                      </div>
                    )}

                    <div className="text-xl font-bold text-primary">
                      {pricePreview
                        ? `€${pricePreview.nonRefundablePrice.finalPrice.toFixed(
                            2,
                          )}`
                        : 'Select dates'}
                    </div>

                    {pricePreview
                      ?.nonRefundablePrice
                      .dealApplied && (
                      <div className="text-xs text-emerald-700 mt-1">
                        Offer + 10%
                        Non-refundable
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={
                isLoadingRooms ||
                isLoadingDeal ||
                isCheckingAvailability ||
                (selectedRoom &&
                  Number(
                    selectedRoom.available_rooms,
                  ) <= 0)
              }
            >
              {isCheckingAvailability && (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              )}

              Review Booking
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}