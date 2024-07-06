"use client";

import { useState } from "react";

export default function Counter({ users }) {
  const [count, setCount] = useState(0);
  console.log(users);

  return (
    <div>
      <p>there are {users.length}</p>
      <button onClick={() => setCount((count) => count + 1)}>{count}</button>
    </div>
  );
}
