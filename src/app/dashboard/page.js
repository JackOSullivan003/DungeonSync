'use client';

import React, { useState, useEffect } from 'react';

import { createTheme } from '@mui/material/styles';
import { green, purple } from '@mui/material/colors';


export default function Page() {

  const [data, setData] = useState([])


  useEffect(() => {
        fetch('http://localhost:3000/api/getCampaignDetails')
          .then((res) => res.json())
          .then((data) => {
            setData(data)
          })
  }, [])


  if (!data) return <p>Loading</p>


  const theme = createTheme({
        palette: {

          secondary: {
            main: green[500],
          },
        },
  });

  return (
        <p></p>
  );
}