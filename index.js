const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Endpoint definitions will go here

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

//****Create a Room****:

let rooms = [];
app.post('/rooms', (req, res) => {
  const { seats, amenities, price } = req.body;
  const room = {
    id: rooms.length + 1,
    seats,
    amenities,
    price,
    bookings: []
  };
  rooms.push(room);
  res.status(201).json(room);
});

//***Book a Room:****

app.post('/rooms/:roomId/book', (req, res) => {
  const { roomId } = req.params;
  const { customerName, date, startTime, endTime } = req.body;
  const room = rooms.find(room => room.id === parseInt(roomId));

  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  // Check for overlapping bookings
  const overlap = room.bookings.some(booking => booking.date === date && 
    ((startTime >= booking.startTime && startTime < booking.endTime) || 
    (endTime > booking.startTime && endTime <= booking.endTime)));

  if (overlap) {
    return res.status(400).json({ message: 'Room is already booked for the selected time' });
  }

  const booking = {
    id: room.bookings.length + 1,
    customerName,
    date,
    startTime,
    endTime
  };
  room.bookings.push(booking);
  res.status(201).json(booking);
});

//****List All Rooms with Booked Data:****

app.get('/rooms', (req, res) => {
  const roomData = rooms.map(room => ({
    roomName: `Room ${room.id}`,
    bookedStatus: room.bookings.length > 0 ? 'Booked' : 'Available',
    bookings: room.bookings
  }));
  res.json(roomData);
});

//******List All Customers with Booked Data: *****/

app.get('/customers', (req, res) => {
  const customers = rooms.flatMap(room =>
    room.bookings.map(booking => ({
      customerName: booking.customerName,
      roomName: `Room ${room.id}`,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime
    }))
  );
  res.json(customers);
});

//******List Number of Times a Customer Has Booked a Room******

app.get('/customers/:name/bookings', (req, res) => {
  const { name } = req.params;
  
  // Initialize a count and an array to store the bookings details
  let bookingCount = 0;
  const customerBookings = [];

  rooms.forEach(room => {
    room.bookings.forEach(booking => {
      if (booking.customerName.toLowerCase() === name.toLowerCase()) {
        bookingCount++;
        customerBookings.push({
          customerName: booking.customerName,
          roomName: `Room ${room.id}`,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          bookingId: booking.id,
          bookingDate: booking.date,
          bookingStatus: 'Confirmed' 
        });
      }
    });
  });

  // Respond with both the number of bookings and the booking details
  res.json({
    customerName: name,
    totalBookings: bookingCount,
    bookings: customerBookings
  });
});
