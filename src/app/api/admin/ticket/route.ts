import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

const WEB3FORMS_KEY = "7f0e27f4-7df7-4105-af7a-985d05cc02d1";

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "super_admin") {
      return NextResponse.json(
        { error: "Unauthorized: Admin authentication required to file a ticket" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      title,
      category = "General Issue",
      urgency = "Medium",
      message,
      reporterName,
      reporterContact,
      systemInfo,
      ticketId = `XIAN-TK-${Math.floor(1000 + Math.random() * 9000)}`,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Ticket title is required" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Ticket description/details are required" }, { status: 400 });
    }

    const config = await dbService.getConfig();
    const storeName = config?.storeName || "Xian Loyalty Platform";

    // Prepare Web3Forms payload
    const web3Payload = {
      access_key: WEB3FORMS_KEY,
      subject: `🚨 [${urgency.toUpperCase()} TICKET] ${title} (${ticketId})`,
      from_name: `${storeName} - Admin Portal`,
      replyto: reporterContact?.includes("@") ? reporterContact : "info@weblix-jo.com",
      Ticket_ID: ticketId,
      Store_Name: storeName,
      Issue_Title: title.trim(),
      Category: category,
      Urgency_Level: urgency,
      Reporter_Name: reporterName || session.name || "Admin",
      Reporter_Contact: reporterContact || session.email || "N/A",
      Detailed_Description: message.trim(),
      System_Environment: systemInfo || "Not specified",
      Submission_Timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Amman" }) + " (Jordan Time)",
    };

    // Forward to Web3Forms API
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(web3Payload),
    });

    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Support ticket dispatched successfully to Weblix engineering team.",
        ticketId,
      });
    } else {
      console.error("Web3Forms response error:", result);
      return NextResponse.json(
        { error: result.message || "Failed to submit ticket via Web3Forms" },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("Ticket submission exception:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error submitting ticket" },
      { status: 500 }
    );
  }
}
