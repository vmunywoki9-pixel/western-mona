import { db } from "./firebase-config.js";

import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";


document.addEventListener("DOMContentLoaded", () => {

  // =========================================================
  // WESTERN MONA TAXIS & SAFARIS
  // BOOKING + EMAILJS + FIREBASE + FARE CALCULATOR
  // =========================================================

  const bookingForm =
    document.getElementById("bookingForm");

  const bookingStatus =
    document.getElementById("bookingStatus");

  const submitBooking =
    document.getElementById("submitBooking");


  // =========================================================
  // EMAILJS CONFIGURATION
  // =========================================================

  const EMAILJS_PUBLIC_KEY =
    "6uC6bQYFyTfuEszTR";

  const EMAILJS_SERVICE_ID =
    "service_z90f5sq";

  const EMAILJS_TEMPLATE_ID =
    "template_gb3hp1q";


  // Initialize EmailJS
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY
  });


  // =========================================================
  // BOOKING SYSTEM
  // =========================================================

  if (
    !bookingForm ||
    !bookingStatus ||
    !submitBooking
  ) {

    console.error(
      "Western Mona: Booking form elements were not found."
    );

    return;
  }


  // Prevent duplicate event listeners
  if (
    bookingForm.dataset.listenerAttached === "true"
  ) {

    console.warn(
      "Western Mona: Booking listener already attached."
    );

    return;
  }


  bookingForm.dataset.listenerAttached = "true";


  let bookingInProgress = false;


  // =========================================================
  // BOOKING REFERENCE
  // =========================================================

  function generateBookingReference() {

    const randomNumber =
      Math.floor(
        10000000 +
        Math.random() * 90000000
      );

    return `WM-${randomNumber}`;
  }


  // =========================================================
  // BOOKING SUBMISSION
  // =========================================================

  bookingForm.addEventListener(
    "submit",
    async (event) => {

      event.preventDefault();
      event.stopPropagation();


      // Prevent double booking
      if (bookingInProgress) {

        console.warn(
          "Western Mona: Duplicate submission blocked."
        );

        return;
      }


      bookingInProgress = true;


      // =====================================================
      // GET FORM ELEMENTS
      // =====================================================

      const nameElement =
        document.getElementById("name");

      const phoneElement =
        document.getElementById("phone");

      const emailElement =
        document.getElementById("email");

      const pickupElement =
        document.getElementById("pickup");

      const destinationElement =
        document.getElementById("destination");

      const dateElement =
        document.getElementById("date");

      const timeElement =
        document.getElementById("time");

      const serviceElement =
        document.getElementById("service");

      const vehicleElement =
        document.getElementById("vehicle");

      const passengersElement =
        document.getElementById("passengers");

      const paymentElement =
        document.getElementById("payment");

      const detailsElement =
        document.getElementById("details");


      const requiredElements = [

        nameElement,
        phoneElement,
        emailElement,
        pickupElement,
        destinationElement,
        dateElement,
        timeElement,
        serviceElement,
        vehicleElement,
        passengersElement,
        paymentElement,
        detailsElement

      ];


      const missingElement =
        requiredElements.find(
          element => !element
        );


      if (missingElement) {

        console.error(
          "Western Mona: One or more booking elements are missing."
        );

        bookingStatus.className =
          "status error";

        bookingStatus.innerHTML = `
          <strong>Booking form error.</strong>
          <br>
          Please refresh the page and try again.
        `;

        bookingInProgress = false;

        return;
      }


      // =====================================================
      // GET VALUES
      // =====================================================

      const name =
        nameElement.value.trim();

      const phone =
        phoneElement.value.trim();

      const email =
        emailElement.value.trim();

      const pickup =
        pickupElement.value.trim();

      const destination =
        destinationElement.value.trim();

      const date =
        dateElement.value;

      const time =
        timeElement.value;

      const service =
        serviceElement.value.trim();

      const vehicle =
        vehicleElement.value.trim();

      const passengers =
        Number(passengersElement.value) || 1;

      const payment =
        paymentElement.value.trim();

      const details =
        detailsElement.value.trim();


      // =====================================================
      // VALIDATION
      // =====================================================

      if (!name) {

        alert(
          "Please enter your full name."
        );

        nameElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!phone) {

        alert(
          "Please enter your phone or WhatsApp number."
        );

        phoneElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!email) {

        alert(
          "Please enter your email address."
        );

        emailElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!emailElement.checkValidity()) {

        alert(
          "Please enter a valid email address."
        );

        emailElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!pickup) {

        alert(
          "Please enter your pickup location."
        );

        pickupElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!destination) {

        alert(
          "Please enter your destination."
        );

        destinationElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!date) {

        alert(
          "Please select your booking date."
        );

        dateElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!time) {

        alert(
          "Please select your booking time."
        );

        timeElement.focus();

        bookingInProgress = false;

        return;
      }


      if (!service) {

        alert(
          "Please select a service."
        );

        serviceElement.focus();

        bookingInProgress = false;

        return;
      }


      // =====================================================
      // GENERATE BOOKING REFERENCE
      // =====================================================

      const reference =
        generateBookingReference();


      // =====================================================
      // FIRESTORE BOOKING
      // =====================================================

      const booking = {

        reference,

        name,

        phone,

        email,

        pickup,

        destination,

        date,

        time,

        service,

        vehicle,

        passengers,

        payment,

        details,

        status: "Pending",

        createdAt:
          serverTimestamp()

      };


      // =====================================================
      // UPDATE BUTTON
      // =====================================================

      submitBooking.disabled = true;

      submitBooking.textContent =
        "Sending booking...";


      bookingStatus.className =
        "status";

      bookingStatus.textContent =
        "Please wait while we submit your booking...";


      try {

        // ===================================================
        // 1. SAVE BOOKING TO FIRESTORE
        // ===================================================

        const docRef =
          await addDoc(
            collection(db, "bookings"),
            booking
          );


        console.log(
          "Booking saved to Firestore:",
          docRef.id
        );


        // ===================================================
        // 2. SEND EMAIL USING EMAILJS
        // ===================================================

        const emailTemplateParams = {

          reference: reference,

          name: name,

          phone: phone,

          email: email,

          pickup: pickup,

          destination: destination,

          date: date,

          time: time,

          service: service,

          vehicle: vehicle,

          passengers: passengers,

          payment: payment,

          details:
            details || "None",

          status: "Pending"

        };


        console.log(
          "Sending booking email..."
        );


        await emailjs.send(

          EMAILJS_SERVICE_ID,

          EMAILJS_TEMPLATE_ID,

          emailTemplateParams

        );


        console.log(
          "Booking email sent successfully."
        );


        // ===================================================
        // 3. SUCCESS MESSAGE
        // ===================================================

        bookingStatus.className =
          "status success";


        bookingStatus.innerHTML = `

          <strong>
            Booking submitted successfully! 🎉
          </strong>

          <br><br>

          Booking reference:
          <strong>
            ${reference}
          </strong>

          <br>

          Your booking has been received.
          We will contact you shortly
          to confirm your ride.

        `;


        // ===================================================
        // 4. WHATSAPP MESSAGE
        // ===================================================

        const whatsappMessage =

`🚕 WESTERN MONA TAXIS & SAFARIS

NEW BOOKING

Reference: ${reference}

Name: ${name}

Phone: ${phone}

Email: ${email}

Service: ${service}

Pickup: ${pickup}

Destination: ${destination}

Date: ${date}

Time: ${time}

Vehicle: ${vehicle}

Passengers: ${passengers}

Payment: ${payment}

Details: ${details || "None"}

Status: Pending`;


        const whatsappButton =
          document.createElement("a");


        whatsappButton.href =
          "https://wa.me/254710666222?text=" +
          encodeURIComponent(
            whatsappMessage
          );


        whatsappButton.target =
          "_blank";


        whatsappButton.rel =
          "noopener noreferrer";


        whatsappButton.className =
          "btn";


        whatsappButton.textContent =
          "Open WhatsApp";


        whatsappButton.style.display =
          "inline-block";


        whatsappButton.style.marginTop =
          "12px";


        bookingStatus.appendChild(
          document.createElement("br")
        );


        bookingStatus.appendChild(
          whatsappButton
        );


        // ===================================================
        // 5. RESET FORM
        // ===================================================

        bookingForm.reset();


        passengersElement.value =
          "1";


        console.log(
          "Western Mona: Booking completed successfully."
        );


      } catch (error) {

        console.error(
          "Western Mona: Booking error:",
          error
        );


        bookingStatus.className =
          "status error";


        bookingStatus.innerHTML = `

          <strong>
            Booking could not be completed.
          </strong>

          <br><br>

          ${error.message ||
            "Please try again later."}

        `;

      } finally {

        submitBooking.disabled =
          false;

        submitBooking.textContent =
          "Confirm & Send Booking";

        bookingInProgress =
          false;

      }

    }
  );


  // =========================================================
  // FARE CALCULATOR
  // =========================================================

  const calculateButton =
    document.getElementById("calculate");


  if (calculateButton) {

    calculateButton.addEventListener(
      "click",
      () => {

        const kmInput =
          document.getElementById("km");

        const fareService =
          document.getElementById("fareService");

        const fareVehicle =
          document.getElementById("fareVehicle");

        const returnTrip =
          document.getElementById("returnTrip");

        const fareResult =
          document.getElementById("fareResult");

        const fareNote =
          document.getElementById("fareNote");


        if (
          !kmInput ||
          !fareService ||
          !fareVehicle ||
          !returnTrip ||
          !fareResult
        ) {

          console.error(
            "Western Mona: Fare calculator elements were not found."
          );

          return;
        }


        const service =
          fareService.value;

        const vehicle =
          fareVehicle.value;

        const km =
          Math.max(
            1,
            Number(kmInput.value) || 1
          );

        const isReturnTrip =
          returnTrip.value === "yes";


        // ===================================================
        // VVIP PACKAGE
        // ===================================================

        if (
          service === "vvip" ||
          vehicle === "vvip"
        ) {

          const price =
            258000;

          const vat =
            price * 0.16;

          const total =
            price + vat;


          fareResult.textContent =
            "KES " +
            total.toLocaleString();


          if (fareNote) {

            fareNote.textContent =
              "VVIP package: KES 258,000 + VAT. Includes 5 Executive SUVs, Chase Car, Police Escort and Free Professional Reels.";

          }


          return;
        }


        // ===================================================
        // STANDARD FARE
        // ===================================================

        const baseCharges = {

          town: 300,

          airport: 1200,

          long: 1500,

          safari: 5000

        };


        const rates = {

          standard: 400,

          suv: 600,

          van: 500,

          "4x4": 600

        };


        const base =
          baseCharges[service] || 0;

        const rate =
          rates[vehicle] || 0;


        let fare =
          base +
          (km * rate);


        // Return trip
        if (isReturnTrip) {

          fare =
            fare * 1.8;

        }


        fareResult.textContent =
          "KES " +
          Math.round(
            fare
          ).toLocaleString();


        if (fareNote) {

          fareNote.textContent =
            "Indicative estimate only. Final fare will be confirmed by Western Mona Taxis & Safaris.";

        }

      }
    );

  }


  // =========================================================
  // MINIMUM BOOKING DATE
  // =========================================================

  const dateInput =
    document.getElementById("date");


  if (dateInput) {

    const today =
      new Date();


    const year =
      today.getFullYear();


    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, "0");


    const day =
      String(
        today.getDate()
      ).padStart(2, "0");


    dateInput.min =
      `${year}-${month}-${day}`;

  }

});