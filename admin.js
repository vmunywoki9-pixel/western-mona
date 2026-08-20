import { db } from "./firebase-config.js";

import {
  collection,
  query,
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


// =========================================================
// ELEMENTS
// =========================================================

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

  console.log(
    "Western Mona Admin Auth:",
    user ? user.email : "Not logged in"
  );


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

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const email =
      document
        .getElementById("adminEmail")
        .value
        .trim();


    const password =
      document
        .getElementById("adminPassword")
        .value;


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
        "Western Mona Admin Login Error:",
        error
      );


      loginError.textContent =
        "Login failed: " +
        error.message;


      loginError.classList.remove(
        "hidden"
      );


    } finally {

      loginButton.disabled = false;

      loginButton.textContent =
        "Login to Dashboard";

    }

  }
);


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

  console.log(
    "Western Mona: Loading bookings from Firestore..."
  );


  if (unsubscribeBookings) {

    unsubscribeBookings();

  }


  const bookingsQuery =
    query(
      collection(db, "bookings")
    );


  unsubscribeBookings =
    onSnapshot(

      bookingsQuery,

      (snapshot) => {

        console.log(
          "Western Mona: Firestore returned",
          snapshot.size,
          "bookings."
        );


        allBookings =
          snapshot.docs.map(
            document => ({

              id: document.id,

              ...document.data()

            })
          );


        // ===============================================
        // SORT NEWEST FIRST
        // ===============================================

        allBookings.sort(
          (a, b) => {

            const timeA =
              getCreatedTime(a.createdAt);

            const timeB =
              getCreatedTime(b.createdAt);


            return timeB - timeA;

          }
        );


        updateStatistics();

        renderBookings();

      },

      (error) => {

        console.error(
          "Western Mona Firestore Error:",
          error
        );


        bookingsList.innerHTML = `

          <div class="no-bookings">

            <strong>
              Unable to load bookings.
            </strong>

            <br><br>

            ${escapeHtml(
              error.message
            )}

          </div>

        `;

      }

    );

}


// =========================================================
// GET FIRESTORE TIMESTAMP
// =========================================================

function getCreatedTime(timestamp) {

  if (!timestamp) {

    return 0;

  }


  // Firebase Timestamp
  if (
    typeof timestamp.toMillis === "function"
  ) {

    return timestamp.toMillis();

  }


  // Timestamp object
  if (
    timestamp.seconds
  ) {

    return timestamp.seconds * 1000;

  }


  return 0;

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
  ).textContent =
    total;


  document.getElementById(
    "pendingBookings"
  ).textContent =
    pending;


  document.getElementById(
    "confirmedBookings"
  ).textContent =
    confirmed;


  document.getElementById(
    "completedBookings"
  ).textContent =
    completed;


  document.getElementById(
    "cancelledBookings"
  ).textContent =
    cancelled;

}


// =========================================================
// SEARCH
// =========================================================

searchBookings.addEventListener(
  "input",
  renderBookings
);


// =========================================================
// STATUS FILTER
// =========================================================

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


  const whatsappMessage =

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
              booking.reference ||
              "No reference"
            )}

          </div>

          <div class="date-time">

            ${escapeHtml(
              booking.date ||
              "No date"
            )}

            •

            ${escapeHtml(
              booking.time ||
              "No time"
            )}

          </div>

        </div>


        <span
          class="status ${statusClass}">

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

          `

          <button
            class="action confirm"
            data-id="${booking.id}"
            data-status="Confirmed">

            ✓ Confirm

          </button>

          `

          :

          ""
        }


        ${
          status === "Confirmed"

          ?

          `

          <button
            class="action complete"
            data-id="${booking.id}"
            data-status="Completed">

            ✓ Mark Completed

          </button>

          `

          :

          ""
        }


        ${
          status !== "Cancelled" &&
          status !== "Completed"

          ?

          `

          <button
            class="action cancel"
            data-id="${booking.id}"
            data-status="Cancelled">

            ✕ Cancel

          </button>

          `

          :

          ""
        }


        ${
          whatsappNumber

          ?

          `

          <a
            class="action whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            href="https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}">

            💬 WhatsApp

          </a>

          `

          :

          ""
        }


      </div>

    </div>

  `;

}


// =========================================================
// BOOKING STATUS ACTIONS
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


          const confirmed =
            confirm(
              `Change this booking to "${newStatus}"?`
            );


          if (!confirmed) {

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
              "Western Mona: Booking status updated:",
              id,
              newStatus
            );


          } catch (error) {

            console.error(
              "Western Mona: Status update failed:",
              error
            );


            alert(
              "Unable to update booking:\n\n" +
              error.message
            );


            button.disabled = false;

          }

        }
      );

    });

}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

  return String(value)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}