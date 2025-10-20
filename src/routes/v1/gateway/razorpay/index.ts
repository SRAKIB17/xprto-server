import crypto from "crypto-js";
import Razorpay from "razorpay";
import { Router } from "tezx";
import { generateUUID } from "tezx/helper";
import { BASE_URL, CLIENT_URL, SITE_TITLE } from "../../../../config.js";
import { performWalletTransaction } from "../../../../utils/createWalletTransaction.js";
import { decrypt, encrypt } from "../../../../utils/encrypted.js";
import { generateTxnID } from "../../../../utils/generateTxnID.js";
import { AppNotificationRefetch, AppNotificationToast } from "../../../websocket/notification.js";
import { AuthorizationBasicAuthAdmin } from "../../admin/auth/basicAuth.js";
import { AuthorizationMiddlewarePublic } from "../../auth/basicAuth.js";

const razorpay = new Router({
  basePath: "rzp"
});
razorpay.post('create/:type', AuthorizationMiddlewarePublic(), async (ctx) => {
  const { amount, prefill, ...rest } = await ctx.req.json();
  const { type } = ctx.req.params
  const { role, user_info } = ctx?.auth ?? {};

  const key_id: any = process.env.RAZORPAY_KEY_ID;
  const key_secret: any = process.env.RAZORPAY_KEY_SECRET;
  const instance = new Razorpay({ key_id: key_id, key_secret: key_secret })
  let txn_id = generateTxnID(
    type
      ?.toUpperCase()
      .replace(/-/g, '')       // সব dash (-) রিমুভ
      .replace(/[AEIOU]/g, '') // সব vowels রিমুভ
  );

  const create = await instance.orders.create({
    amount: Number(amount) * 100,
    currency: "INR",
    receipt: "receipt#" + txn_id,
    notes: {}
  })
  if (create?.status === 'created') {
    const payload = {
      create: create,
      prefill: {
        ...prefill,
        role: role,
        name: user_info?.fullname,
        phone: user_info?.phone,
        email: user_info?.email,
        user_id: user_info?.user_id,
      },
      type: type,
      exp: Date.now() + 10 * 60_000, // 60 min expiry
      reference_type: type?.toUpperCase().replace(/-/g, ' '),
      reference_id: create?.id,
      amount: amount,
      currency: "INR",
      external_txn_id: txn_id,
      ...rest,
    }

    const { success: encSuccess, encrypted } = encrypt(JSON.stringify(payload), process.env.PAYMENT_GATEWAY_ENCRYPTION_KEY!);

    if (!encSuccess) {
      return ctx.json({
        success: false,
        message: "Something went wrong When create order. Please try again!"
      });
    }

    let url = `${BASE_URL}/v1/gateway/rzp/checkout/ui?payment=${encrypted}`;
    return await ctx.json({
      success: true,
      txn_id: txn_id,
      url: url
    })
  }
  else {
    return ctx.json({
      success: false,
      message: "Order create failed"
    })
  }
});


razorpay.post('/checkout', async (ctx) => {
  const { create, prefill, order, response } = await ctx.req.json();
  try {

    const { reference_type, type, reference_id, currency } = order;
    const key_id = process.env.RAZORPAY_KEY_ID;
    const secret: any = process.env.RAZORPAY_KEY_SECRET;

    const { razorpay_payment_id, razorpay_signature, razorpay_order_id } = response;

    // Verify signature
    const expectedSignature = crypto.HmacSHA256(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      secret
    ).toString();

    const succeeded = expectedSignature === razorpay_signature;

    if (!succeeded) {
      AppNotificationToast(ctx, {
        socket_id: prefill?.socket_id,
        title: "Payment Failed",
        message: "Payment verification failed.",
        type: "error"
      });

      return ctx.json({ success: false, message: "Payment verification failed" });
    };

    // Perform wallet transaction
    await performWalletTransaction({
      user_id: prefill?.user_id,
      role: prefill?.role,
    }, {
      amount: order?.amount,
      type: type,
      payment_id: razorpay_payment_id,
      currency: currency ?? "INR",
      payment_method: "Razorpay",
      external_txn_id: order?.external_txn_id,
      idempotency_key: generateUUID(),
      reference_id,
      reference_type,
      ...order,
    });

    AppNotificationToast(ctx, {
      socket_id: prefill?.socket_id,
      title: "Payment Successful",
      message: "Your payment has been processed successfully.",
      type: "success"
    });

    AppNotificationRefetch(ctx, {
      socket_id: prefill?.socket_id,
      loading: {
        wallet: true,
      }
    });
    return ctx.json({ success: true, message: "Payment successful" });
  } catch (err) {
    AppNotificationToast(ctx, {
      socket_id: prefill?.socket_id,
      title: "Payment Failed",
      message: "Your payment could not be processed. Please try again.",
      type: "error"
    });
    console.error("Razorpay checkout error:", err);
    return ctx.json({ success: false, message: "Something went wrong." });
  }
});


razorpay.get("/checkout/ui", async (ctx) => {
  const { payment } = ctx?.req?.query;
  if (!payment) {
    return ctx.html(`
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Payment</title>
    </head>
    <body
        style="margin:0;padding:0;font-family: 'Inter', sans-serif;background:#f0f4f8;display:flex;justify-content:center;align-items:center;height:100vh;">

        <div
            style="background:#ffffff;padding:40px 30px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.1);text-align:center;max-width:400px;width:90%;">


            <h2 style="color:#001743;font-size:1.8rem;margin-bottom:12px;">Invalid Payment Request</h2>

            <p style="color:#64748b;font-size:1rem;margin-bottom:24px;line-height:1.5;">
                We could not process your payment. Please check the link or try again.
            </p>

            <a href="${CLIENT_URL}"
                style="display:inline-block;padding:12px 28px;background:#001743;color:#FFDC5C;font-weight:600;border-radius:8px;text-decoration:none;transition:all 0.3s;">
                Go Back Home
            </a>

        </div>

    </body>
</html>
    `);
  }
  const { success, decrypted } = decrypt(payment as string, process.env.PAYMENT_GATEWAY_ENCRYPTION_KEY!)
  if (!success || !decrypted) {
    return ctx.html(`
 <!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invalid Payment Link</title>
    </head>
    <body
        style="margin:0;padding:0;font-family: 'Inter', sans-serif;background:#f0f4f8;display:flex;justify-content:center;align-items:center;height:100vh;">

        <div
            style="background:#ffffff;padding:40px 30px;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.1);text-align:center;max-width:450px;width:90%;">

            <h2 style="color:#001743;font-size:1.8rem;margin-bottom:12px;">Invalid or Expired Payment Link</h2>

            <p style="color:#64748b;font-size:1rem;margin-bottom:24px;line-height:1.5;">
                The payment link you used is either invalid or has expired. Please try again or contact support for
                assistance.
            </p>

            <a href="${CLIENT_URL}"
                style="display:inline-block;padding:12px 28px;background:#001743;color:#FFDC5C;font-weight:600;border-radius:8px;text-decoration:none;transition:all 0.3s;">
                Go Back Home
            </a>

        </div>

    </body>
</html>
    `);
  }
  const payment_info = JSON.parse(decrypted ?? "{}");
  const { create, prefill, ...rest } = payment_info;
  const key = process.env.RAZORPAY_KEY_ID!;
  if (Date.now() > rest?.exp) {
    return ctx.html(`
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Expired</title>
        <style>
            body {
                font-family: 'Inter', sans-serif;
                background-color: #f0f4f8;
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
            }

            .card {
                background-color: #ffffff;
                padding: 40px 30px;
                border-radius: 16px;
                text-align: center;
                max-width: 450px;
                width: 90%;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }

            .icon {
                font-size: 60px;
                color: #FFDC5C;
                margin-bottom: 20px;
            }

            .title {
                font-size: 1.8rem;
                color: #001743;
                margin-bottom: 12px;
            }

            .message {
                font-size: 1rem;
                color: #64748b;
                margin-bottom: 24px;
                line-height: 1.5;
            }

            .btn {
                display: inline-block;
                padding: 12px 28px;
                background-color: #001743;
                color: #FFDC5C;
                font-weight: 600;
                border-radius: 8px;
                text-decoration: none;
                transition: all 0.3s;
            }

            .btn:hover {
                background-color: #001a64;
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="icon">⏳</div>
            <div class="title">Payment Expired</div>
            <div class="message">
                Sorry, this payment link has expired. Please try again or contact support for assistance.
            </div>
            <a href="${CLIENT_URL}" class="btn">Go Back Home</a>
        </div>
    </body>
</html>
  `);
  }
  return ctx.html(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Razorpay Payment | ${SITE_TITLE || "XPRTO"}</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #f8fafc;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    #container {
      text-align: center;
      background: #fff;
      padding: 30px 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    button {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 14px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
    }
    button:hover {
      background-color: #2563eb;
    }
  </style>
</head>
<body>



  <div style="background: #ffffff; border-radius: 16px; box-shadow: 0 8px 20px rgba(0,0,0,0.08); max-width: 420px; width: 100%; padding: 24px; border: 2px solid #00174320;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="/razorpay-icon.png" alt="Razorpay" style="width: 80px; height: auto; margin-bottom: 8px;" />
      <h2 style="color: #001743; font-weight: 700; font-size: 1.5rem; margin: 0;">Payment Summary</h2>
      <p style="color: #64748b; font-size: 0.9rem; margin-top: 4px;">Transaction processed securely with Razorpay</p>
    </div>

    <div id="paymentMessage" 
     style="margin-top: 16px; padding: 12px 16px; border-radius: 8px; display: block; font-weight: 600; text-align: center;">
     fdsff
    </div>

    <div id="timer" style="text-align:center; margin-bottom:12px;">
      <span style="font-weight:600; color:#001743;">Time Left: </span>
      <span id="countdown" style="font-weight:600; color:red;">--:--</span>
    </div>
    <div style="border-top: 2px solid #FFDC5C; margin: 12px 0 20px 0;"></div>
    <table id="details" style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
      <tbody>
        <tr>
          <td style="padding: 8px 0; color: #001743; font-weight: 600;">Reference Type:</td>
          <td style="padding: 8px 0; text-align: right; color: #334155;">${rest?.reference_type}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #001743; font-weight: 600;">Reference ID:</td>
          <td style="padding: 8px 0; text-align: right; color: #334155;">
            ${rest?.reference_id}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #001743; font-weight: 600;">Amount:</td>
          <td style="padding: 8px 0; text-align: right; color: #16a34a; font-weight: 600;">
            ₹${rest?.amount}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #001743; font-weight: 600;">Currency:</td>
          <td style="padding: 8px 0; text-align: right; color: #334155;">${rest?.currency ?? "INR"}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #001743; font-weight: 600;">XPRTO Txn ID:</td>
          <td style="padding: 8px 0; text-align: right; color: #334155;">${rest?.external_txn_id}</td>
        </tr>
      </tbody>
    </table>

    <div style="margin-top: 24px; text-align: center;">
      <button id="payBtn" style="background-color: #001743; color: white; font-weight: 600; padding: 10px 24px; border-radius: 8px; border: none; cursor: pointer; transition: all 0.3s;">
        Proceed to Pay
      </button>
      <p style="margin-top: 12px; color: #64748b; font-size: 0.8rem;">
        Powered by <span style="color: #001743; font-weight: 600;">Razorpay</span>
      </p>
    </div>
  </div>

  <script>
    // Calculate remaining time in milliseconds
    let expiryTime = ${rest?.exp}; // from server
    const countdownEl = document.getElementById("countdown");

    function updateCountdown() {
      const now = Date.now();
      const diff = expiryTime - now;
      if (diff <= 0) {
        countdownEl.textContent = "00:00";
        alert("⚠️ Payment link expired!");
        window.location.reload(); // or redirect
        return;
      }
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      countdownEl.textContent = \`\${minutes.toString().padStart(2, '0')}: \${seconds.toString().padStart(2, '0')}\`;
    }

    updateCountdown(); // initial call
    setInterval(updateCountdown, 1000);
  </script>

  <script>
    const key = "${key}";

    const loadScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    const displayRazorpay = async (options) => {
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        alert("⚠️ Razorpay SDK failed to load. Please check your connection.");
        return;
      }
      const rzp = new window.Razorpay(options);

      rzp.on('payment.submit', (response) => {
        console.log("Payment Method:", response.method);
      });

      rzp.on('payment.failed', (response) => {
        console.error("Payment Failed:", response.error);
        alert("❌ Payment Failed! Payment ID: " + response.error.metadata.payment_id);
      });

      rzp.open();
    };

    const messageEl = document.getElementById("paymentMessage");
    const payBtn = document.getElementById("payBtn");
    const details = document.getElementById("details");
    const timer = document.getElementById("timer");

    document.getElementById("payBtn").addEventListener("click", () => {
      const options = {
        key,
        amount: ${create?.amount},
        currency: "INR",
        name: "${SITE_TITLE || "XPRTO"}",
        image: "/favicon.ico",
        order_id: "${create.id}",
        handler: async function(response) {
          try {
              const res = await fetch("${BASE_URL}/v1/gateway/rzp/checkout", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  response,
                  create: ${JSON.stringify(create)},
                  prefill: ${JSON.stringify(prefill)},
                  order: ${JSON.stringify(rest)}
                })
              });
              const data = await res.json();
              payBtn.style.display = "none";
              details.style.display = "none";
              timer.style.display = "none";
              messageEl.style.display = "block";
              messageEl.style.color = "#fff";
              messageEl.style.backgroundColor = data?.success ? "#16a34a" : "#ef4444"; // green or red
              messageEl.textContent = data?.message || (data?.success ? "Payment successful!" : "Payment failed. Please try again.");
              
          } 
          catch (err) {
            payBtn.style.display = "none";
            details.style.display = "none";
            timer.style.display = "none";
            messageEl.style.display = "block";
            messageEl.style.color = "#fff";
            messageEl.style.backgroundColor = data?.success ? "#16a34a" : "#ef4444"; // green or red

            messageEl.textContent = data?.message || (data?.success ? "Payment successful!" : "Payment failed. Please try again.");
            console.error("Checkout error:", err);
          }
        },
        prefill: {
          name: "${prefill?.name}",
          email: "${prefill?.email}",
          contact: "${prefill?.phone ?? prefill?.contact}",
        },
        notes: {
          address: "${SITE_TITLE || "XPRTO"}"
        },
        theme: {
          color: "#001743"
        }
      };
      displayRazorpay(options);
    });
  </script>
</body>
</html>
  `);
})


export default razorpay;