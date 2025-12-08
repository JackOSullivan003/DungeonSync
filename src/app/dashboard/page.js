'use client';

import React, { useState, useEffect } from 'react';

export default function Page() {

  const [data, setData] = useState([])


  useEffect(() => {
        fetch('/api/dashboard')
          .then((res) => res.json())
          .then((data) => {
            setData(data)
          })
  }, [])


  if (!data) return <p>Loading</p>


  return (
        <p>{data}</p>
  );
}