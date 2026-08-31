import "dotenv/config";

import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   ENVIRONMENT
========================================================= */

const {
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  JWT_SECRET,
} = process.env;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL in .env");
}

if (!SUPABASE_SECRET_KEY) {
  throw new Error("Missing SUPABASE_SECRET_KEY in .env");
}

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in .env");
}

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/* =========================================================
   WISP
========================================================= */

wisp.options.allowLoopback = true;

/* =========================================================
   FASTIFY
========================================================= */

const fastify = Fastify({
  logger: true,
});

/* =========================================================
   CORS
========================================================= */

await fastify.register(fastifyCors, {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ],
  methods: [
    "GET",
    "POST",
    "OPTIONS",
  ],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
});

/* =========================================================
   HELPERS
========================================================= */

function normalizeUsername(value) {
  return String(value || "").trim();
}

function usernameIsValid(username) {
  return /^[A-Za-z0-9_]{3,24}$/.test(username);
}

function passwordIsValid(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    password.length <= 128
  );
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      username: user.username,
    },
    JWT_SECRET,
    {
      expiresIn: "30d",
      issuer: "my-os",
      audience: "my-os-client",
    }
  );
}

function readBearerToken(request) {
  const authorization = request.headers.authorization;

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  return authorization.slice(7).trim();
}

async function requireAuth(request, reply) {
  const token = readBearerToken(request);

  if (!token) {
    return reply.code(401).send({
      error: "You are not signed in.",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: "my-os",
      audience: "my-os-client",
    });

    request.myOsUser = {
      id: payload.sub,
      username: payload.username,
    };
  } catch {
    return reply.code(401).send({
      error: "Your session is invalid or expired.",
    });
  }
}

/* =========================================================
   HEALTH CHECK
========================================================= */

fastify.get("/api/health", async () => {
  return {
    ok: true,
    service: "my-os",
  };
});

/* =========================================================
   CREATE ACCOUNT
========================================================= */

fastify.post("/api/auth/signup", async (request, reply) => {
  const username = normalizeUsername(
    request.body?.username
  );

  const password = request.body?.password;

  if (!usernameIsValid(username)) {
    return reply.code(400).send({
      error:
        "Username must be 3-24 characters and use only letters, numbers, or underscores.",
    });
  }

  if (!passwordIsValid(password)) {
    return reply.code(400).send({
      error:
        "Password must be between 8 and 128 characters.",
    });
  }

  const { data: existingUser, error: lookupError } =
    await supabase
      .from("profiles")
      .select("id")
      .ilike("username", username)
      .maybeSingle();

  if (lookupError) {
    request.log.error(lookupError);

    return reply.code(500).send({
      error: "Could not check username.",
    });
  }

  if (existingUser) {
    return reply.code(409).send({
      error: "That username is already taken.",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const id = crypto.randomUUID();

  const { data: profile, error: insertError } =
    await supabase
      .from("profiles")
      .insert({
        id,
        username,
        display_name: username,
        password_hash: passwordHash,
        role: "user",
      })
      .select(
        "id, username, display_name, role, created_at"
      )
      .single();

  if (insertError) {
    request.log.error(insertError);

    if (insertError.code === "23505") {
      return reply.code(409).send({
        error: "That username is already taken.",
      });
    }

    return reply.code(500).send({
      error: "Could not create account.",
    });
  }

  const token = createToken(profile);

  return reply.code(201).send({
    token,

    user: {
      id: profile.id,
      username: profile.username,
      displayName:
        profile.display_name || profile.username,
      role: profile.role || "user",
      createdAt: profile.created_at,
    },
  });
});

/* =========================================================
   LOGIN
========================================================= */

fastify.post("/api/auth/login", async (request, reply) => {
  const username = normalizeUsername(
    request.body?.username
  );

  const password = request.body?.password;

  if (!username || typeof password !== "string") {
    return reply.code(400).send({
      error: "Username and password are required.",
    });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, password_hash, role, created_at"
    )
    .ilike("username", username)
    .maybeSingle();

  if (error) {
    request.log.error(error);

    return reply.code(500).send({
      error: "Could not sign in.",
    });
  }

  if (!profile) {
    return reply.code(401).send({
      error: "Invalid username or password.",
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    profile.password_hash
  );

  if (!passwordMatches) {
    return reply.code(401).send({
      error: "Invalid username or password.",
    });
  }

  const token = createToken(profile);

  return {
    token,

    user: {
      id: profile.id,
      username: profile.username,
      displayName:
        profile.display_name || profile.username,
      role: profile.role || "user",
      createdAt: profile.created_at,
    },
  };
});

/* =========================================================
   CURRENT ACCOUNT
========================================================= */

fastify.get(
  "/api/me",
  {
    preHandler: requireAuth,
  },
  async (request, reply) => {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name, role, created_at"
      )
      .eq("id", request.myOsUser.id)
      .maybeSingle();

    if (error) {
      request.log.error(error);

      return reply.code(500).send({
        error: "Could not load account.",
      });
    }

    if (!profile) {
      return reply.code(404).send({
        error: "Account no longer exists.",
      });
    }

    return {
      user: {
        id: profile.id,
        username: profile.username,
        displayName:
          profile.display_name || profile.username,
        role: profile.role || "user",
        createdAt: profile.created_at,
      },
    };
  }
);

/* =========================================================
   USER SEARCH
========================================================= */

fastify.get(
  "/api/users/search",
  {
    preHandler: requireAuth,
  },
  async (request, reply) => {
    const query = normalizeUsername(
      request.query?.q
    );

    if (query.length < 2) {
      return {
        users: [],
      };
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .ilike("username", `%${query}%`)
      .neq("id", request.myOsUser.id)
      .limit(10);

    if (error) {
      request.log.error(error);

      return reply.code(500).send({
        error: "Could not search users.",
      });
    }

    return {
      users: (data || []).map((profile) => ({
        id: profile.id,
        username: profile.username,
        displayName:
          profile.display_name || profile.username,
      })),
    };
  }
);

/* =========================================================
   CREATE OR FIND DIRECT CONVERSATION
========================================================= */

fastify.post(
  "/api/conversations",
  {
    preHandler: requireAuth,
  },
  async (request, reply) => {
    const currentUserId = request.myOsUser.id;

    const otherUserId = String(
      request.body?.userId || ""
    ).trim();

    if (!otherUserId) {
      return reply.code(400).send({
        error: "A userId is required.",
      });
    }

    if (otherUserId === currentUserId) {
      return reply.code(400).send({
        error:
          "You cannot start a conversation with yourself.",
      });
    }

    const { data: otherUser, error: userError } =
      await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", otherUserId)
        .maybeSingle();

    if (userError) {
      request.log.error(userError);

      return reply.code(500).send({
        error: "Could not load user.",
      });
    }

    if (!otherUser) {
      return reply.code(404).send({
        error: "User not found.",
      });
    }

    const {
      data: currentMemberships,
      error: membershipError,
    } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (membershipError) {
      request.log.error(membershipError);

      return reply.code(500).send({
        error:
          "Could not check existing conversations.",
      });
    }

    const currentConversationIds = (
      currentMemberships || []
    ).map(
      (membership) =>
        membership.conversation_id
    );

    if (currentConversationIds.length > 0) {
      const {
        data: sharedMemberships,
        error: sharedError,
      } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in(
          "conversation_id",
          currentConversationIds
        );

      if (sharedError) {
        request.log.error(sharedError);

        return reply.code(500).send({
          error:
            "Could not check existing conversations.",
        });
      }

      if (
        sharedMemberships &&
        sharedMemberships.length > 0
      ) {
        const existingConversationId =
          sharedMemberships[0].conversation_id;

        return {
          conversation: {
            id: existingConversationId,
            otherUser: {
              id: otherUser.id,
              username: otherUser.username,
              displayName:
                otherUser.display_name ||
                otherUser.username,
            },
          },
          created: false,
        };
      }
    }

    const conversationId = crypto.randomUUID();

    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("conversations")
      .insert({
        id: conversationId,
        created_by: currentUserId,
      })
      .select("id, created_at")
      .single();

    if (conversationError) {
      request.log.error(conversationError);

      return reply.code(500).send({
        error: "Could not create conversation.",
      });
    }

    const { error: membersError } =
      await supabase
        .from("conversation_members")
        .insert([
          {
            conversation_id:
              conversationId,
            user_id: currentUserId,
          },
          {
            conversation_id:
              conversationId,
            user_id: otherUserId,
          },
        ]);

    if (membersError) {
      request.log.error(membersError);

      await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      return reply.code(500).send({
        error:
          "Could not add conversation members.",
      });
    }

    return reply.code(201).send({
      conversation: {
        id: conversation.id,
        createdAt: conversation.created_at,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          displayName:
            otherUser.display_name ||
            otherUser.username,
        },
      },
      created: true,
    });
  }
);

/* =========================================================
   LOAD MY CONVERSATIONS
========================================================= */

fastify.get(
  "/api/conversations",
  {
    preHandler: requireAuth,
  },
  async (request, reply) => {
    const currentUserId =
      request.myOsUser.id;

    const {
      data: memberships,
      error: membershipsError,
    } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    if (membershipsError) {
      request.log.error(
        membershipsError
      );

      return reply.code(500).send({
        error:
          "Could not load conversations.",
      });
    }

    const conversationIds = (
      memberships || []
    ).map(
      (membership) =>
        membership.conversation_id
    );

    if (conversationIds.length === 0) {
      return {
        conversations: [],
      };
    }

    const {
      data: conversations,
      error: conversationsError,
    } = await supabase
      .from("conversations")
      .select("id, created_at")
      .in("id", conversationIds)
      .order("created_at", {
        ascending: false,
      });

    if (conversationsError) {
      request.log.error(
        conversationsError
      );

      return reply.code(500).send({
        error:
          "Could not load conversations.",
      });
    }

    const {
      data: allMembers,
      error: membersError,
    } = await supabase
      .from("conversation_members")
      .select(
        "conversation_id, user_id"
      )
      .in(
        "conversation_id",
        conversationIds
      )
      .neq(
        "user_id",
        currentUserId
      );

    if (membersError) {
      request.log.error(membersError);

      return reply.code(500).send({
        error:
          "Could not load conversation members.",
      });
    }    const otherUserIds = [
      ...new Set(
        (allMembers || []).map(
          (membership) =>
            membership.user_id
        )
      ),
    ];

    let profiles = [];

    if (otherUserIds.length > 0) {
      const {
        data: profileRows,
        error: profilesError,
      } = await supabase
        .from("profiles")
        .select(
          "id, username, display_name"
        )
        .in("id", otherUserIds);

      if (profilesError) {
        request.log.error(
          profilesError
        );

        return reply.code(500).send({
          error:
            "Could not load conversation users.",
        });
      }

      profiles = profileRows || [];
    }

    const profileById = new Map(
      profiles.map((profile) => [
        profile.id,
        profile,
      ])
    );

    const otherMemberByConversation =
      new Map();

    for (
      const membership of allMembers || []
    ) {
      if (
        !otherMemberByConversation.has(
          membership.conversation_id
        )
      ) {
        otherMemberByConversation.set(
          membership.conversation_id,
          membership.user_id
        );
      }
    }

    return {
      conversations: (
        conversations || []
      ).map((conversation) => {
        const otherUserId =
          otherMemberByConversation.get(
            conversation.id
          );

        const otherUser =
          profileById.get(otherUserId);

        return {
          id: conversation.id,
          createdAt:
            conversation.created_at,
          otherUser: otherUser
            ? {
                id: otherUser.id,
                username:
                  otherUser.username,
                displayName:
                  otherUser.display_name ||
                  otherUser.username,
              }
            : null,
        };
      }),
    };
  }
);

/* =========================================================
   CONVERSATION MESSAGES
========================================================= */

async function requireConversationMember(
  conversationId,
  userId
) {
  const {
    data: membership,
    error,
  } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq(
      "conversation_id",
      conversationId
    )
    .eq("user_id", userId)
    .maybeSingle();

  return {
    isMember: Boolean(membership),
    error,
  };
}

/* =========================================================
   LOAD MESSAGES
========================================================= */

fastify.get(
  "/api/conversations/:id/messages",
  {
    preHandler: requireAuth,
  },
  async (request, reply) => {
    const conversationId = String(
      request.params?.id || ""
    ).trim();

    const currentUserId =
      request.myOsUser.id;

    if (!conversationId) {
      return reply.code(400).send({
        error:
          "A conversation id is required.",
      });
    }

    const {
      isMember,
      error: membershipError,
    } =
      await requireConversationMember(
        conversationId,
        currentUserId
      );

    if (membershipError) {
      request.log.error(
        membershipError
      );

      return reply.code(500).send({
        error:
          "Could not verify conversation access.",
      });
    }

    if (!isMember) {
      return reply.code(403).send({
        error:
          "You are not a member of this conversation.",
      });
    }

    const {
      data: messages,
      error,
    } = await supabase
      .from("messages")
      .select(
        "id, conversation_id, sender_id, content, created_at"
      )
      .eq(
        "conversation_id",
        conversationId
      )
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      request.log.error(error);

      return reply.code(500).send({
        error:
          "Could not load messages.",
      });
    }

    return {
      messages: (
        messages || []
      ).map((message) => ({
        id: message.id,
        conversationId:
          message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: message.created_at,
      })),
    };
  }
);

/* =========================================================
   SEND MESSAGE
========================================================= */

fastify.post(
  "/api/conversations/:id/messages",
  {
    preHandler: requireAuth,
  },
  async (request, reply) => {
    const conversationId = String(
      request.params?.id || ""
    ).trim();

    const currentUserId =
      request.myOsUser.id;

    const content = String(
      request.body?.content || ""
    ).trim();

    if (!conversationId) {
      return reply.code(400).send({
        error:
          "A conversation id is required.",
      });
    }

    if (!content) {
      return reply.code(400).send({
        error:
          "Message cannot be empty.",
      });
    }

    if (content.length > 4000) {
      return reply.code(400).send({
        error:
          "Message cannot be longer than 4000 characters.",
      });
    }

    const {
      isMember,
      error: membershipError,
    } =
      await requireConversationMember(
        conversationId,
        currentUserId
      );

    if (membershipError) {
      request.log.error(
        membershipError
      );

      return reply.code(500).send({
        error:
          "Could not verify conversation access.",
      });
    }

    if (!isMember) {
      return reply.code(403).send({
        error:
          "You are not a member of this conversation.",
      });
    }

    const messageId =
      crypto.randomUUID();

    const {
      data: message,
      error,
    } = await supabase
      .from("messages")
      .insert({
        id: messageId,
        conversation_id:
          conversationId,
        sender_id: currentUserId,
        content,
      })
      .select(
        "id, conversation_id, sender_id, content, created_at"
      )
      .single();

    if (error) {
      request.log.error(error);

      return reply.code(500).send({
        error:
          "Could not send message.",
      });
    }

    return reply.code(201).send({
      message: {
        id: message.id,
        conversationId:
          message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: message.created_at,
      },
    });
  }
);

/* =========================================================
   STATIC AETHER OS BUILD
========================================================= */

await fastify.register(
  fastifyStatic,
  {
    root: path.join(
      __dirname,
      "dist"
    ),
    prefix: "/",
  }
);

/* =========================================================
   WISP WEBSOCKET
========================================================= */

fastify.server.on(
  "upgrade",
  (
    request,
    socket,
    head
  ) => {
    wisp.routeRequest(
      request,
      socket,
      head
    );
  }
);

/* =========================================================
   START SERVER
========================================================= */

const PORT = Number(process.env.PORT) || 5001;

const HOST = process.env.RENDER
  ? "0.0.0.0"
  : "127.0.0.1";

try {
  await fastify.listen({
    port: PORT,
    host: HOST,
  });

  console.log(
    `Aether OS server running on ${HOST}:${PORT}`
  );

  console.log(
    "Aether OS account API ready."
  );
} catch (error) {
  fastify.log.error(error);
  process.exit(1);
}