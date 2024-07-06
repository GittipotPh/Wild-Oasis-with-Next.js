"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "./auth";
import { getBookings } from "./data-service";
import { supabase } from "./supabase";

export async function updateGuest(formData) {
  console.log(formData);
  const session = await auth();
  if (!session) throw new Error("Please logged in first");

  const nationalID = formData.get("nationalID");
  const [nationality, countryFlag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalID))
    throw new Error("Please provide a valid national ID");

  const updateData = { nationality, countryFlag, nationalID };

  const { data, error } = await supabase
    .from("guests")
    .update(updateData)
    .eq("id", session.user.guestId);

  if (error) {
    console.error(error);
    throw new Error("Guest could not be updated");
  }

  revalidatePath("/account/profile");
}

export async function createBooking(bookingData, formData) {
  const session = await auth();
  if (!session) throw new Error("Please logged in first");

  // console.log("This is ", formData.entries());

  // console.log("This is ", Object.entries(formData.entries()));
  console.log("Form Data Entries:", Array.from(formData.entries()));

  const newBooking = {
    ...bookingData,
    guestId: session.user.guestId,
    numGuests: Number(formData.get("numGuests")),
    observations: formData.get("observations").slice(0, 1000),
    extrasPrice: bookingData.cabinPrice,
    isPaid: false,
    hasBreakfast: false,
    status: "unconfirmed"
  };

  console.log("Booking Data to Insert:", newBooking);

  const { error } = await supabase.from("bookings").insert([newBooking]);
  // So that the newly created object gets returned!
  // .select()
  // .single();

  if (error) {
    throw new Error("Booking could not be created");
  }

  revalidatePath(`/cabins/${bookingData.cabinId}`);
  redirect("/cabins/thankyou");
}

export async function deleteBooking(bookingId) {
  await new Promise((res) => setTimeout(res, 2000));
  throw new Error();
  const session = await auth();
  if (!session) throw new Error("Please logged in first");

  const guestBookings = await getBookings(session.user.guestId);

  const guestBookingsId = guestBookings.map((booking) => booking.id);

  if (!guestBookingsId.includes(bookingId))
    throw new Error("You are not allowed to delete this booking");

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) throw new Error("Booking could not be deleted");

  revalidatePath("/account/reservations");
}

export async function updateBooking(formData) {
  //1) Authentication
  const bookingId = Number(formData.get("bookingId"));
  const session = await auth();
  if (!session) throw new Error("Please logged in first");

  //2 Authorization
  const guestBookings = await getBookings(session.user.guestId);

  const guestBookingsId = guestBookings.map((booking) => booking.id);

  if (!guestBookingsId.includes(bookingId))
    throw new Error("You are not allowed to delete this booking");

  //3 Update data
  const updateData = {
    numGuests: formData.get("numGuests"),
    observations: formData.get("observations").slice(0, 1000)
  };

  // 4 Mutation

  const { error } = await supabase
    .from("bookings")
    .update(updateData)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }

  revalidatePath(`/account/reservations/edit/${bookingId}`);
  revalidatePath("/account/reservations");

  redirect("/account/reservations");
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
