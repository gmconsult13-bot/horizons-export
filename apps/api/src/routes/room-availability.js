import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /room-availability/:roomTypeId
router.get('/:roomTypeId', async (req, res) => {
  const { roomTypeId } = req.params;

  if (!roomTypeId) {
    return res.status(400).json({ error: 'Room type ID is required' });
  }

  const rules = await pb.collection('room_availability_rules').getFullList({
    filter: `room_type = "${roomTypeId}" && is_active = true`,
  });

  const formattedRules = rules.map((rule) => ({
    id: rule.id,
    rule_type: rule.rule_type,
    start_date: rule.start_date || null,
    end_date: rule.end_date || null,
    day_of_week: rule.day_of_week !== undefined ? rule.day_of_week : null,
    reason: rule.reason || null,
    is_active: rule.is_active,
  }));

  logger.info(`Fetched ${formattedRules.length} active availability rules for room type ${roomTypeId}`);
  res.json({ rules: formattedRules });
});

// POST /room-availability/:roomTypeId
router.post('/:roomTypeId', async (req, res) => {
  const { roomTypeId } = req.params;
  const { rule_type, start_date, end_date, day_of_week, reason, is_active } = req.body;

  if (!roomTypeId) {
    return res.status(400).json({ error: 'Room type ID is required' });
  }

  // Validate rule_type
  const validRuleTypes = ['closed_date', 'closed_range', 'closed_day_of_week'];
  if (!rule_type || !validRuleTypes.includes(rule_type)) {
    return res.status(400).json({
      error: `rule_type must be one of: ${validRuleTypes.join(', ')}`,
    });
  }

  // Validate based on rule_type
  if (rule_type === 'closed_date') {
    if (!start_date) {
      throw new Error('start_date is required for closed_date rule');
    }
  } else if (rule_type === 'closed_range') {
    if (!start_date || !end_date) {
      throw new Error('start_date and end_date are required for closed_range rule');
    }
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    if (endDateObj < startDateObj) {
      throw new Error('end_date must be greater than or equal to start_date');
    }
  } else if (rule_type === 'closed_day_of_week') {
    if (day_of_week === undefined || day_of_week === null) {
      throw new Error('day_of_week is required for closed_day_of_week rule');
    }
    if (typeof day_of_week !== 'number' || day_of_week < 0 || day_of_week > 6) {
      throw new Error('day_of_week must be a number between 0 (Sunday) and 6 (Saturday)');
    }
  }

  // Create the rule record
  const newRule = await pb.collection('room_availability_rules').create({
    room_type: roomTypeId,
    rule_type,
    start_date: start_date || null,
    end_date: end_date || null,
    day_of_week: day_of_week !== undefined ? day_of_week : null,
    reason: reason || null,
    is_active: is_active !== undefined ? is_active : true,
  });

  logger.info(`Created availability rule ${newRule.id} for room type ${roomTypeId}`);
  res.json({
    success: true,
    rule: {
      id: newRule.id,
      rule_type: newRule.rule_type,
      start_date: newRule.start_date || null,
      end_date: newRule.end_date || null,
      day_of_week: newRule.day_of_week !== undefined ? newRule.day_of_week : null,
      reason: newRule.reason || null,
      is_active: newRule.is_active,
    },
  });
});

// PUT /room-availability/:ruleId
router.put('/:ruleId', async (req, res) => {
  const { ruleId } = req.params;
  const { rule_type, start_date, end_date, day_of_week, reason, is_active } = req.body;

  if (!ruleId) {
    return res.status(400).json({ error: 'Rule ID is required' });
  }

  // Fetch existing rule
  const existingRule = await pb.collection('room_availability_rules').getOne(ruleId);

  // Use provided values or fall back to existing values
  const updatedRuleType = rule_type || existingRule.rule_type;
  const updatedStartDate = start_date !== undefined ? start_date : existingRule.start_date;
  const updatedEndDate = end_date !== undefined ? end_date : existingRule.end_date;
  const updatedDayOfWeek = day_of_week !== undefined ? day_of_week : existingRule.day_of_week;

  // Validate rule_type
  const validRuleTypes = ['closed_date', 'closed_range', 'closed_day_of_week'];
  if (!validRuleTypes.includes(updatedRuleType)) {
    return res.status(400).json({
      error: `rule_type must be one of: ${validRuleTypes.join(', ')}`,
    });
  }

  // Validate based on rule_type
  if (updatedRuleType === 'closed_date') {
    if (!updatedStartDate) {
      throw new Error('start_date is required for closed_date rule');
    }
  } else if (updatedRuleType === 'closed_range') {
    if (!updatedStartDate || !updatedEndDate) {
      throw new Error('start_date and end_date are required for closed_range rule');
    }
    const startDateObj = new Date(updatedStartDate);
    const endDateObj = new Date(updatedEndDate);
    if (endDateObj < startDateObj) {
      throw new Error('end_date must be greater than or equal to start_date');
    }
  } else if (updatedRuleType === 'closed_day_of_week') {
    if (updatedDayOfWeek === undefined || updatedDayOfWeek === null) {
      throw new Error('day_of_week is required for closed_day_of_week rule');
    }
    if (typeof updatedDayOfWeek !== 'number' || updatedDayOfWeek < 0 || updatedDayOfWeek > 6) {
      throw new Error('day_of_week must be a number between 0 (Sunday) and 6 (Saturday)');
    }
  }

  // Update the rule record
  const updatedRule = await pb.collection('room_availability_rules').update(ruleId, {
    rule_type: updatedRuleType,
    start_date: updatedStartDate || null,
    end_date: updatedEndDate || null,
    day_of_week: updatedDayOfWeek !== undefined ? updatedDayOfWeek : null,
    reason: reason !== undefined ? reason : existingRule.reason,
    is_active: is_active !== undefined ? is_active : existingRule.is_active,
  });

  logger.info(`Updated availability rule ${ruleId}`);
  res.json({
    success: true,
    rule: {
      id: updatedRule.id,
      rule_type: updatedRule.rule_type,
      start_date: updatedRule.start_date || null,
      end_date: updatedRule.end_date || null,
      day_of_week: updatedRule.day_of_week !== undefined ? updatedRule.day_of_week : null,
      reason: updatedRule.reason || null,
      is_active: updatedRule.is_active,
    },
  });
});

// DELETE /room-availability/:ruleId
router.delete('/:ruleId', async (req, res) => {
  const { ruleId } = req.params;

  if (!ruleId) {
    return res.status(400).json({ error: 'Rule ID is required' });
  }

  await pb.collection('room_availability_rules').delete(ruleId);

  logger.info(`Deleted availability rule ${ruleId}`);
  res.json({ success: true, message: 'Rule deleted' });
});

// GET /room-availability/:roomTypeId/check-availability
router.get('/:roomTypeId/check-availability', async (req, res) => {
  const { roomTypeId } = req.params;
  const { start_date, end_date } = req.query;

  if (!roomTypeId) {
    return res.status(400).json({ error: 'Room type ID is required' });
  }

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date query parameters are required' });
  }

  const startDateObj = new Date(start_date);
  const endDateObj = new Date(end_date);

  if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' });
  }

  if (endDateObj < startDateObj) {
    return res.status(400).json({ error: 'end_date must be greater than or equal to start_date' });
  }

  // Fetch all active rules for this room type
  const rules = await pb.collection('room_availability_rules').getFullList({
    filter: `room_type = "${roomTypeId}" && is_active = true`,
  });

  const blockedDates = [];
  let blockingReason = null;

  // Generate all dates in the range
  const currentDate = new Date(startDateObj);
  const dateRange = [];
  while (currentDate <= endDateObj) {
    dateRange.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Check each rule against the date range
  for (const rule of rules) {
    if (rule.rule_type === 'closed_date') {
      // Check if the closed date falls within the range
      const ruleDate = new Date(rule.start_date);
      ruleDate.setHours(0, 0, 0, 0);

      for (const dateInRange of dateRange) {
        const checkDate = new Date(dateInRange);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate.getTime() === ruleDate.getTime()) {
          const dateStr = rule.start_date.split('T')[0];
          if (!blockedDates.includes(dateStr)) {
            blockedDates.push(dateStr);
          }
          if (!blockingReason) {
            blockingReason = rule.reason || 'Room unavailable on this date';
          }
        }
      }
    } else if (rule.rule_type === 'closed_range') {
      // Check if the closed range overlaps with the query range
      const ruleStartDate = new Date(rule.start_date);
      const ruleEndDate = new Date(rule.end_date);
      ruleStartDate.setHours(0, 0, 0, 0);
      ruleEndDate.setHours(0, 0, 0, 0);

      for (const dateInRange of dateRange) {
        const checkDate = new Date(dateInRange);
        checkDate.setHours(0, 0, 0, 0);

        if (checkDate >= ruleStartDate && checkDate <= ruleEndDate) {
          const dateStr = dateInRange.toISOString().split('T')[0];
          if (!blockedDates.includes(dateStr)) {
            blockedDates.push(dateStr);
          }
          if (!blockingReason) {
            blockingReason = rule.reason || 'Room unavailable during this period';
          }
        }
      }
    } else if (rule.rule_type === 'closed_day_of_week') {
      // Check if any date in the range matches the closed day of week
      const closedDayOfWeek = rule.day_of_week;

      for (const dateInRange of dateRange) {
        if (dateInRange.getDay() === closedDayOfWeek) {
          const dateStr = dateInRange.toISOString().split('T')[0];
          if (!blockedDates.includes(dateStr)) {
            blockedDates.push(dateStr);
          }
          if (!blockingReason) {
            blockingReason = rule.reason || `Room unavailable on ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][closedDayOfWeek]}s`;
          }
        }
      }
    }
  }

  const available = blockedDates.length === 0;

  logger.info(`Checked availability for room type ${roomTypeId} from ${start_date} to ${end_date}: ${available ? 'available' : 'blocked'}`);
  res.json({
    available,
    blocked_dates: blockedDates.sort(),
    reason: blockingReason,
  });
});

export default router;