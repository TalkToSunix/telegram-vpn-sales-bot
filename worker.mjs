export default {
  async fetch(request, env) {
    const TELEGRAM_TOKEN = env.TELEGRAM_TOKEN;
    const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
  
    const CHANNEL_ID = "@NOTHiNGoVPN";
    const ADMINS = ["ایدی عددی", "ایدی عددی", "ایدی عددی"];
  
    const CARD_NUMBER = "شماره کارت";
    const CARD_OWNER = " اسم شماره کارت";
  
    async function tg(method, body) {
      await fetch(`${TELEGRAM_API}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  
    async function isMember(userId) {
      const res = await fetch(
        `${TELEGRAM_API}/getChatMember?chat_id=${CHANNEL_ID}&user_id=${userId}`
      );
      const data = await res.json();
      return ["member", "administrator", "creator"].includes(data?.result?.status);
    }
  
    const MAIN_MENU = {
      keyboard: [
        [{ text: "🛒 خرید اشتراک" }, { text: "📖 راهنمای اتصال" }],
        [{ text: "💬 پشتیبانی" }],
      ],
      resize_keyboard: true,
    };
  
    const PLANS_MENU = {
      keyboard: [
        [
          { text: "💎 1 گیگ | 500 هزار تومان" },
          { text: "💎 2 گیگ | 950 هزار تومان" },
        ],
        [
          { text: "🔥 3 گیگ | 1400 هزار تومان" },
          { text: "🔥 5 گیگ | 2250 هزار تومان" },
        ],
        [
          { text: "🚀 10 گیگ | 3550 هزار تومان" },
          { text: "🚀 15 گیگ | 4950 هزار تومان" },
        ],
        [
          { text: "👑 20 گیگ | 6950 هزار تومان" },
        ],
        [{ text: "🔙 بازگشت به صفحه اصلی" }],
      ],
      resize_keyboard: true,
    };
  
    const OS_MENU = {
      keyboard: [
        [{ text: "🤖 اندروید (Android)" }, { text: "🍏 آی او اس (iOS)" }],
        [{ text: "💻 ویندوز (Windows)" }, { text: "🍎 مک (Mac)" }],
        [{ text: "🐧 لینوکس (Linux)" }],
        [{ text: "🔙 بازگشت به صفحه اصلی" }],
      ],
      resize_keyboard: true,
    };
  
    const PLANS = new Map([
      ["💎 1 گیگ | 500 هزار تومان", 500],
      ["💎 2 گیگ | 950 هزار تومان", 950],
      ["🔥 3 گیگ | 1400 هزار تومان", 1400],
      ["🔥 5 گیگ | 2250 هزار تومان", 2250],
      ["🚀 10 گیگ | 3550 هزار تومان", 3550],
      ["🚀 15 گیگ | 4950 هزار تومان", 4950],
      ["👑 20 گیگ | 6950 هزار تومان", 6950],
    ]);
  
    if (request.method !== "POST") return new Response("OK");
  
    const update = await request.json();
  
    // =========================================================
    // ✅ قابلیت جدید: ریپلای ادمین روی رسید -> ارسال پیام/کانفیگ برای همون مشتری
    // =========================================================
    if (update.message) {
      const senderId = String(update.message.chat?.id || "");
  
      // فقط ادمین‌ها
      if (ADMINS.includes(senderId) && update.message.reply_to_message) {
        const r = update.message.reply_to_message;
  
        // روش 1 (بهترین): ادمین روی پیام فوروارد شده رسید ریپلای کرده
        const directUserId = r?.forward_from?.id ? String(r.forward_from.id) : null;
  
        // روش 2: ادمین روی پیام اطلاع ریپلای کرده (USER: <id>)
        let userIdFromNotice = null;
        if (r?.text) {
          const m = r.text.match(/USER:\s*(\d+)/);
          if (m) userIdFromNotice = String(m[1]);
        }
  
        const targetUserId = directUserId || userIdFromNotice;
  
        if (targetUserId) {
          // هرچی ادمین فرستاده (متن/فایل/عکس/کانفیگ) همونطوری برای کاربر کپی میشه
          await tg("copyMessage", {
            chat_id: targetUserId,
            from_chat_id: senderId,
            message_id: update.message.message_id,
          });
  
          await tg("sendMessage", {
            chat_id: senderId,
            text: `✅ پیام برای کاربر ارسال شد: ${targetUserId}`,
          });
  
          return new Response("OK");
        } else {
          await tg("sendMessage", {
            chat_id: senderId,
            text:
              "⚠️ از روی این ریپلای آیدی کاربر پیدا نشد.\n" +
              "روی خودِ پیام فورواردِ رسید ریپلای کن (نه روی پیام‌های دیگه).",
          });
          return new Response("OK");
        }
      }
    }
  
    // ===== تایید / رد ادمین
    if (update.callback_query) {
      const adminId = String(update.callback_query.from.id);
      if (!ADMINS.includes(adminId)) return new Response("OK");
  
      const [action, userId] = update.callback_query.data.split("_");
  
      if (action === "accept") {
        await tg("sendMessage", {
          chat_id: userId,
          text: "🔄 رسید شما تایید شد.سرویس در حال ساخت لطفا صبور باشید...",
        });
      }
  
      if (action === "reject") {
        await tg("sendMessage", {
          chat_id: userId,
          text: "❌ پرداخت شما رد شد. لطفاً رسید واضح‌تر ارسال کنید یا با پشتیبانی تماس بگیرید.",
        });
      }
  
      return new Response("OK");
    }
  
    if (!update.message) return new Response("OK");
  
    const chatId = update.message.chat.id;
    const text = update.message.text;
  
    if (!(await isMember(chatId))) {
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          "🚨 برای استفاده از ربات ابتدا در کانال زیر عضو شوید:\n\n" +
          "📢 @NOTHiNGoVPN\n\n" +
          "سپس /start را ارسال کنید",
      });
      return new Response("OK");
    }
  
    // ===== ارسال رسید
    if (update.message.photo) {
      // پیام اطلاع برای هر ادمین (که اگر روی اینم ریپلای کرد، USER رو دربیاریم)
      for (const admin of ADMINS) {
        await tg("sendMessage", {
          chat_id: admin,
          text:
            `📩 کاربر رسید پرداخت ارسال کرد\n` +
            `USER: ${chatId}\n` +
            `روی خودِ رسید ریپلای کن تا پیام/کانفیگ مستقیم برای خودش بره.`,
          reply_markup: {
            inline_keyboard: [
              [{ text: "✅ تایید", callback_data: `accept_${chatId}` }],
              [{ text: "❌ رد", callback_data: `reject_${chatId}` }],
            ],
          },
        });
      }
  
      // رسید رو برای همه ادمین‌ها فوروارد کن (قبلاً فقط ADMINS[0] بود)
      for (const admin of ADMINS) {
        await tg("forwardMessage", {
          chat_id: admin,
          from_chat_id: chatId,
          message_id: update.message.message_id,
        });
      }
  
      await tg("sendMessage", {
        chat_id: chatId,
        text: "🕒 رسید شما ارسال شد و در حال بررسی توسط ادمین می‌باشد.",
      });
  
      return new Response("OK");
    }
  
    if (text === "/start" || text === "🔙 بازگشت به صفحه اصلی") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "⭐️ به NOTHINGooVPN خوش آمدید\nیکی از گزینه‌ها را انتخاب کنید:",
        reply_markup: MAIN_MENU,
      });
      return new Response("OK");
    }
  
    if (text === "🛒 خرید اشتراک") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "📦 بسته مورد نظر را انتخاب کنید:",
        reply_markup: PLANS_MENU,
      });
      return new Response("OK");
    }
  
    if (PLANS.has(text)) {
      const price = PLANS.get(text);
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          `💳 مبلغ ${price} هزار تومان را به کارت زیر واریز کنید:\n\n` +
          `${CARD_NUMBER}\n` +
          `به نام ${CARD_OWNER}\n\n` +
          `سپس رسید پرداخت(رسید به صورت عکس نه متن) را ارسال کنید.`,
      });
      return new Response("OK");
    }
  
    if (text === "📖 راهنمای اتصال") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "📱 سیستم عامل خود را انتخاب کنید:",
        reply_markup: OS_MENU,
      });
      return new Response("OK");
    }
  
    if (
      ["🤖 اندروید (Android)", "🍏 آی او اس (iOS)", "💻 ویندوز (Windows)", "🍎 مک (Mac)", "🐧 لینوکس (Linux)"].includes(
        text
      )
    ) {
      await tg("sendMessage", {
        chat_id: chatId,
        text:
          "📌 راهنمای اتصال:\n\n" +
          "اندروید: V2RayNG\n" +
          "iOS: Streisand / NV Tunnel\n" +
          "ویندوز: V2RayN\n" +
          "مک: Streisand / V2RayN\n" +
          "لینوکس: V2RayN",
      });
      return new Response("OK");
    }
  
    if (text === "💬 پشتیبانی") {
      await tg("sendMessage", {
        chat_id: chatId,
        text: "💬 ارتباط با پشتیبانی:\n@NOTHINGooSupport",
      });
      return new Response("OK");
    }
  
    return new Response("OK");
  },
 };
