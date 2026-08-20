import { db } from "./firebase-config.js";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


const auth = getAuth();

const loginPage =
  document.getElementById("loginPage");

const dashboard =
  document.getElementById("dashboard");

const loginForm =
  document.getElementById("loginForm");

const loginButton =
  document.getElementById("loginButton");

const loginError =
  document.getElementById("loginError");

const logoutButton =
  document.getElementById("logoutButton");

const bookingsList =
  document.getElementById("bookingsList");

const searchBookings =
  document.getElementById("searchBookings");

const statusFilter =
  document.getElementById("statusFilter");


let allBookings = [];

let unsubscribeBookings = null;


// =========================================================
// AUTHENTICATION
// =========================================================

onAuthStateChanged(auth, (user) => {

  if (user) {

    loginPage.style.display = "none";

    dashboard.style.display = "block";

    loadBookings();

  } else {

    loginPage.style.display = "flex";

    dashboard.style.display = "none";

    if (unsubscribeBookings) {

      unsubscribeBookings();

      unsubscribeBookings = null;

    }

  }

});


// =========================================================
// LOGIN
// =========================================================

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email =
    document.getElementById("adminEmail").value.trim();

  const password =
    document.getElementById("adminPassword").value;

  loginError.classList.add("hidden");

  loginButton.disabled = true;

  loginButton.textContent =
    "Signing in...";


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  } catch (error) {

    console.error(
      "Western Mona login error:",
      error
    );

    loginError.textContent =
      "Login failed: " +
      error.message;

    loginError.classList.remove("hidden");

  } finally {

    loginButton.disabled = false;

    loginButton.textContent =
      "Login to Dashboard";

  }

});


// =========================================================
// LOGOUT
// =========================================================

logoutButton.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    }

  }
);


// =========================================================
// LOAD BOOKINGS
// =========================================================

function loadBookings() {

  if (unsubscribeBookings) {

    unsubscribeBookings();

  }


  const bookingsQuery =
    query(
      collection(db, "bookings"),
      orderBy("createdAt", "desc")
    );


  unsubscribeBookings =
    onSnapshot(
      bookingsQuery,

      (snapshot) => {

        allBookings =
          snapshot.docs.map(
            document => ({

              id: document.id,

              ...document.data()

            })
          );


        updateStatistics();

        renderBookings();

      },

      (error) => {

        console.error(
          "Firestore loading error:",
          error
        );

        bookingsList.innerHTML = `
          <div class="no-bookings">
            Unable to load bookings.<br>
            ${escapeHtml(error.message)}
          </div>
        `;

      }
    );

}


// =========================================================
// STATISTICS
// =========================================================

function updateStatistics() {

  const total =
    allBookings.length;


  const pending =
    allBookings.filter(
      booking =>
        booking.status === "Pending"
    ).length;


  const confirmed =
    allBookings.filter(
      booking =>
        booking.status === "Confirmed"
    ).length;


  const completed =
    allBookings.filter(
      booking =>
        booking.status === "Completed"
    ).length;


  const cancelled =
    allBookings.filter(
      booking =>
        booking.status === "Cancelled"
    ).length;


  document.getElementById(
    "totalBookings"
  ).textContent = total;


  document.getElementById(
    "pendingBookings"
  ).textContent = pending;


  document.getElementById(
    "confirmedBookings"
  ).textContent = confirmed;


  document.getElementById(
    "completedBookings"
  ).textContent = completed;


  document.getElementById(
    "cancelledBookings"
  ).textContent = cancelled;

}


// =========================================================
// SEARCH + FILTER
// =========================================================

searchBookings.addEventListener(
  "input",
  renderBookings
);


statusFilter.addEventListener(
  "change",
  renderBookings
);


// =========================================================
// RENDER BOOKINGS
// =========================================================

function renderBookings() {

  const search =
    searchBookings.value
      .trim()
      .toLowerCase();


  const filter =
    statusFilter.value;


  const filtered =
    allBookings.filter(
      booking => {

        const searchable = [

          booking.reference,

          booking.name,

          booking.phone,

          booking.email,

          booking.pickup,

          booking.destination,

          booking.service,

          booking.vehicle

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();


        const matchesSearch =
          !search ||
          searchable.includes(search);


        const matchesStatus =
          filter === "all" ||
          booking.status === filter;


        return (
          matchesSearch &&
          matchesStatus
        );

      }
    );


  if (!filtered.length) {

    bookingsList.innerHTML = `
      <div class="no-bookings">
        No bookings found.
      </div>
    `;

    return;

  }


  bookingsList.innerHTML =
    filtered
      .map(createBookingCard)
      .join("");


  attachBookingActions();

}


// =========================================================
// CREATE BOOKING CARD
// =========================================================

function createBookingCard(booking) {

  const status =
    booking.status || "Pending";


  let statusClass =
    "status-pending";


  if (status === "Confirmed") {

    statusClass =
      "status-confirmed";

  }


  if (status === "Completed") {

    statusClass =
      "status-completed";

  }


  if (status === "Cancelled") {

    statusClass =
      "status-cancelled";

  }


  const whatsappText =
`Hello ${booking.name || ""},

This is Western Mona Taxis & Safaris regarding your booking.

Booking Reference: ${booking.reference || ""}

Pickup: ${booking.pickup || ""}
Destination: ${booking.destination || ""}
Date: ${booking.date || ""}
Time: ${booking.time || ""}

Thank you.`;


  const whatsappNumber =
    (booking.phone || "")
      .replace(/\D/g, "");


  return `

    <div class="booking">

      <div class="booking-header">

        <div>

          <div class="reference">

            ${escapeHtml(
              booking.reference || "No reference"
            )}

          </div>

          <div class="date-time">

            ${escapeHtml(
              booking.date || "No date"
            )}

            •

            ${escapeHtml(
              booking.time || "No time"
            )}

          </div>

        </div>

        <span class="status ${statusClass}">

          ${escapeHtml(status)}

        </span>

      </div>


      <div class="booking-grid">


        <div class="info">

          <span class="info-label">
            Customer
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.name || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Phone
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.phone || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Email
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.email || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Pickup
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.pickup || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Destination
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.destination || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Service
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.service || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Vehicle
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.vehicle || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Passengers
          </span>

          <span class="info-value">

            ${booking.passengers || 1}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Payment
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.payment || "-"
            )}

          </span>

        </div>


        <div class="info">

          <span class="info-label">
            Details
          </span>

          <span class="info-value">

            ${escapeHtml(
              booking.details || "None"
            )}

          </span>

        </div>


      </div>


      <div class="booking-actions">

        ${
          status !== "Confirmed" &&
          status !== "Completed" &&
          status !== "Cancelled"

          ?

          `<button
            class="action confirm"
            data-id="${booking.id}"
            data-status="Confirmed">

            ✓ Confirm

          </button>`

          :

          ""
        }


        ${
          status === "Confirmed"

          ?

          `<button
            class="action complete"
            data-id="${booking.id}"
            data-status="Completed">

            ✓ Mark Completed

          </button>`

          :

          ""
        }


        ${
          status !== "Cancelled" &&
          status !== "Completed"

          ?

          `<button
            class="action cancel"
            data-id="${booking.id}"
            data-status="Cancelled">

            ✕ Cancel

          </button>`

          :

          ""
        }


        ${
          whatsappNumber

          ?

          `<a
            class="action whatsapp"
            target="_blank"
            rel="noopener"
            href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}">

            💬 WhatsApp

          </a>`

          :

          ""
        }

      </div>

    </div>

  `;

}


// =========================================================
// BOOKING ACTIONS
// =========================================================

function attachBookingActions() {

  document
    .querySelectorAll(
      "[data-status]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const id =
            button.dataset.id;

          const newStatus =
            button.dataset.status;


          const confirmation =
            confirm(
              `Change this booking to "${newStatus}"?`
            );


          if (!confirmation) {

            return;

          }


          button.disabled = true;


          try {

            await updateDoc(
              doc(
                db,
                "bookings",
                id
              ),
              {
                status: newStatus
              }
            );


            console.log(
              "Booking status updated:",
              id,
              newStatus
            );


          } catch (error) {

            console.error(
              "Unable to update booking:",
              error
            );


            alert(
              "Unable to update booking: " +
              error.message
            );


            button.disabled = false;

          }

        }
      );

    });

}


// =========================================================
// SECURITY: ESCAPE HTML
// =========================================================

function escapeHtml(value) {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}