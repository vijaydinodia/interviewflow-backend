const db = require("../models/index");
const path = require("path");
const fs = require("fs");
const { Op } = require("sequelize");

const getJsonLinks = () => {
  try {
    const filePath = path.join(__dirname, "../utils/google_meet_links.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => item.link).filter(Boolean);
      }
    }
  } catch (err) {
    console.error("Error reading google_meet_links.json:", err.message);
  }
  return [
    "https://meet.google.com/aij-pwtx-nwz",
    "https://meet.google.com/ubz-uvki-gne",
    "https://meet.google.com/nok-gibs-kzd",
  ];
};

let linksSeeded = false;

const seedMeetingLinksIfEmpty = async () => {
  if (linksSeeded) return;
  try {
    const count = await db.meetingLinkModel.count();
    if (count === 0) {
      const links = getJsonLinks();
      for (const link of links) {
        await db.meetingLinkModel.findOrCreate({
          where: { link },
          defaults: {
            link,
            isOccupied: false,
            tag: "available",
            durationMinutes: 60,
          },
        });
      }
      console.log(`Seeded ${links.length} Google Meet links into meeting_links table.`);
    }
    linksSeeded = true;
  } catch (err) {
    console.warn("Meeting links seed note:", err.message);
  }
};

/**
 * Automatically releases any expired links (release_at < NOW())
 */
const autoReleaseExpiredLinks = async () => {
  try {
    const now = new Date();
    await db.meetingLinkModel.update(
      {
        isOccupied: false,
        assignedRequestId: null,
        tag: "available",
        occupiedAt: null,
        releaseAt: null,
      },
      {
        where: {
          isOccupied: true,
          releaseAt: { [Op.lt]: now },
        },
      }
    );
  } catch (err) {
    console.warn("Auto-release expired links note:", err.message);
  }
};

/**
 * Allocates a Google Meet link for an accepted session.
 * Saves in database with tag, timestamp, and duration, returning the active link.
 */
exports.allocateMeetingLink = async ({ requestId, durationMinutes = 60, tag = "active_interview" }) => {
  await seedMeetingLinksIfEmpty();
  await autoReleaseExpiredLinks();

  try {
    const now = new Date();
    const releaseTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

    // 1. Check if this requestId already has an allocated link
    const existing = await db.meetingLinkModel.findOne({
      where: { assignedRequestId: requestId, isOccupied: true },
    });

    if (existing) {
      // Extend or renew time
      await existing.update({
        occupiedAt: now,
        releaseAt: releaseTime,
        tag,
        durationMinutes,
      });
      return existing.link;
    }

    // 2. Find first available link
    let availableLink = await db.meetingLinkModel.findOne({
      where: {
        [Op.or]: [
          { isOccupied: false },
          { releaseAt: { [Op.lt]: now } },
        ],
      },
      order: [["updatedAt", "ASC"]],
    });

    // 3. Fallback if all links are temporarily occupied
    if (!availableLink) {
      availableLink = await db.meetingLinkModel.findOne({
        order: [["releaseAt", "ASC"]],
      });
    }

    if (availableLink) {
      await availableLink.update({
        isOccupied: true,
        assignedRequestId: requestId,
        tag,
        durationMinutes,
        occupiedAt: now,
        releaseAt: releaseTime,
      });
      console.log(`Allocated link '${availableLink.link}' to request '${requestId}' [Tag: ${tag}, Duration: ${durationMinutes} mins, ReleaseAt: ${releaseTime.toISOString()}]`);
      return availableLink.link;
    }
  } catch (err) {
    console.error("Error in allocateMeetingLink:", err.message);
  }

  // Graceful fallback link
  return "https://meet.google.com/aij-pwtx-nwz";
};

/**
 * Releases a link when an interview is completed, cancelled, or rejected.
 */
exports.releaseMeetingLink = async (requestId) => {
  if (!requestId) return;
  try {
    const [affected] = await db.meetingLinkModel.update(
      {
        isOccupied: false,
        assignedRequestId: null,
        tag: "available",
        occupiedAt: null,
        releaseAt: null,
      },
      {
        where: { assignedRequestId: requestId },
      }
    );
    if (affected > 0) {
      console.log(`Released meeting link for request '${requestId}'. Available for another meeting.`);
    }
  } catch (err) {
    console.warn("Error in releaseMeetingLink:", err.message);
  }
};

exports.seedMeetingLinksIfEmpty = seedMeetingLinksIfEmpty;
exports.autoReleaseExpiredLinks = autoReleaseExpiredLinks;
