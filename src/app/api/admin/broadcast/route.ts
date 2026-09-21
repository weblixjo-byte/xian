import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";
import { sendWebPushToSubscriptions } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 403 });
    }

    const { title, message, bonusPoints, audience = "all", targetCustomerId } = await req.json();

    if (!title || !message) {
      return NextResponse.json({ error: "Notification title and message are required" }, { status: 400 });
    }

    if (audience === "single" && !targetCustomerId) {
      return NextResponse.json({ error: "Target customer must be selected" }, { status: 400 });
    }

    const bonus = Number(bonusPoints) || 0;
    let bonusCreditedCount = 0;

    if (audience === "single") {
      const targetUser = await dbService.findUserById(targetCustomerId);
      if (!targetUser) {
        return NextResponse.json({ error: "Target customer not found" }, { status: 404 });
      }

      const notif = await dbService.createNotification({
        customerId: targetUser._id,
        title: title.trim(),
        message: message.trim(),
        type: bonus > 0 ? "POINTS_EARNED" : "BROADCAST",
      });

      if (bonus > 0) {
        const newBalance = (targetUser.pointsBalance || 0) + bonus;
        const newLifetime = (targetUser.lifetimePoints || 0) + bonus;
        await dbService.updateUser(targetUser._id, {
          pointsBalance: newBalance,
          lifetimePoints: newLifetime,
        });

        await dbService.createTransaction({
          type: "EARN",
          customerId: targetUser._id,
          customerName: targetUser.name,
          customerPhone: targetUser.phone,
          billAmount: 0,
          points: bonus,
          balanceAfter: newBalance,
          referenceCode: `NOTIF-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: `Targeted Promo: ${title}`,
        });
        bonusCreditedCount = 1;
      }

      // Dispatch real Web Push to customer's active devices
      const targetSubs = await dbService.getPushSubscriptionsForUser(targetUser._id);
      const pushDevicesSent = await sendWebPushToSubscriptions(targetSubs, {
        title: title.trim(),
        body: bonus > 0 ? `${message.trim()} (+${bonus} bonus points added to your balance!)` : message.trim(),
        url: "/customer",
      });

      return NextResponse.json({
        success: true,
        audience: "single",
        recipientName: targetUser.name,
        notification: notif,
        bonusCreditedTo: bonusCreditedCount,
        pushDevicesSent,
      });
    }

    // Filter target audience group
    const allCustomers = await dbService.getAllCustomers(1000);
    let targetCustomers = allCustomers;

    if (audience === "gold" || audience === "vip") {
      targetCustomers = allCustomers.filter((c) => c.tier === "Gold");
    } else if (audience === "silver") {
      targetCustomers = allCustomers.filter((c) => c.tier === "Silver");
    } else if (audience === "inactive") {
      targetCustomers = allCustomers.filter((c) => (c.pointsBalance || 0) <= 0 || (c.lifetimePoints || 0) <= 50);
    }

    // Create broadcast or group notifications
    const notif = await dbService.createNotification({
      customerId: audience === "all" ? "all" : `audience_${audience}`,
      title: title.trim(),
      message: message.trim(),
      type: "BROADCAST",
    });

    if (bonus > 0) {
      for (const cust of targetCustomers) {
        const newBalance = (cust.pointsBalance || 0) + bonus;
        const newLifetime = (cust.lifetimePoints || 0) + bonus;
        await dbService.updateUser(cust._id, {
          pointsBalance: newBalance,
          lifetimePoints: newLifetime,
        });

        await dbService.createTransaction({
          type: "EARN",
          customerId: cust._id,
          customerName: cust.name,
          customerPhone: cust.phone,
          billAmount: 0,
          points: bonus,
          balanceAfter: newBalance,
          referenceCode: `BC-${Math.floor(100000 + Math.random() * 900000)}`,
          notes: `Broadcast Promo (${audience}): ${title}`,
        });
        bonusCreditedCount++;
      }
    }

    // Dispatch real Web Push to registered customer devices for this audience
    const allSubs = await dbService.getAllPushSubscriptions();
    let relevantSubs = allSubs;
    if (audience !== "all") {
      const targetUserIds = new Set(targetCustomers.map((c) => c._id.toString()));
      relevantSubs = allSubs.filter((sub) => sub.userId && targetUserIds.has(sub.userId.toString()));
    }

    const pushDevicesSent = await sendWebPushToSubscriptions(relevantSubs, {
      title: title.trim(),
      body: bonus > 0 ? `${message.trim()} (+${bonus} bonus points added!)` : message.trim(),
      url: "/customer",
    });

    return NextResponse.json({
      success: true,
      audience,
      recipientsCount: targetCustomers.length,
      notification: notif,
      bonusCreditedTo: bonusCreditedCount,
      pushDevicesSent,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
