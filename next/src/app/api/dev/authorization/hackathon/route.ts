import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
    HackathonAction,
    HackathonAuthorizer,
} from "@/modules/hackathons/backend/authorization";

export async function GET() {
    console.log("");
    console.log("=======================================================");
    console.log("🚀 HACKATHON AUTHORIZATION TEST");
    console.log("=======================================================");

    // -------------------------------------------------------------------------
    // Better Auth
    // -------------------------------------------------------------------------

    console.log("");
    console.log("🔐 Fetching Better Auth Session...");

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        console.log("❌ No active session found.");

        return NextResponse.json(
            {
                error: "Not authenticated",
            },
            {
                status: 401,
            },
        );
    }

    console.log("✅ Session Found");
    console.dir(session, { depth: null });

    // -------------------------------------------------------------------------
    // User
    // -------------------------------------------------------------------------

    console.log("");
    console.log("👤 Fetching User...");

    const actor = await prisma.user.findUniqueOrThrow({
        where: {
            id: session.user.id,
        },
    });

    console.log("✅ User");
    console.dir(actor, { depth: null });

    // -------------------------------------------------------------------------
    // Hackathon
    // -------------------------------------------------------------------------

    console.log("");
    console.log("🏆 Fetching Hackathon...");

    const hackathon = await prisma.hackathon.findFirstOrThrow();

    console.log("✅ Hackathon");
    console.dir(hackathon, { depth: null });

    // -------------------------------------------------------------------------
    // Membership
    // -------------------------------------------------------------------------

    console.log("");
    console.log("👥 Fetching Membership...");

    const membership = await prisma.hackathonMember.findUnique({
        where: {
            hackathonId_userId: {
                hackathonId: hackathon.id,
                userId: actor.id,
            },
        },
    });

    console.log("✅ Membership");
    console.dir(membership, { depth: null });

    // -------------------------------------------------------------------------
    // Context
    // -------------------------------------------------------------------------

    const context = {
        actor,
        hackathon,
        membership,
    };

    console.log("");
    console.log("📦 Authorization Context");
    console.dir(context, { depth: null });

    // -------------------------------------------------------------------------
    // Authorization
    // -------------------------------------------------------------------------

    const action = HackathonAction.EDIT;

    console.log("");
    console.log("🎯 Action");
    console.log(action);

    console.log("");
    console.log("⚖️ Running Authorization...");

    const decision = HackathonAuthorizer.can(
        context,
        action,
    );

    console.log("");
    console.log("📋 Authorization Decision");
    console.dir(decision, { depth: null });

    console.log("");
    console.log("=======================================================");
    console.log(
        decision.allowed
            ? "✅ AUTHORIZATION PASSED"
            : "❌ AUTHORIZATION FAILED",
    );
    console.log("=======================================================");
    console.log("");

    return NextResponse.json({
        session,
        actor,
        hackathon,
        membership,
        decision,
    });
}