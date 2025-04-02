import React, { useState, useEffect } from 'react';
import { Box, Heading, Flex, Text, Button, VStack, HStack, useToast } from '@chakra-ui/react';
import Papa from 'papaparse';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const App = () => {
  const [data, setData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [cpiChange, setCpiChange] = useState(null);
  const toast = useToast();

  const [originalData, setOriginalData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/cpi_data.csv');
        const csv = await response.text();
        
        Papa.parse(csv, {
          header: true,
          complete: (results) => {
            const parsedData = results.data
              .filter(item => item.Date && item.CPI)
              .map(item => ({
                ...item,
                Date: new Date(item.Date),
                CPI: parseFloat(item.CPI)
              }));
            setData(parsedData);
            setOriginalData(parsedData);
          }
        });
      } catch (error) {
        toast({
          title: 'Error loading data',
          description: 'Failed to load CPI data',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    fetchData();
  }, []);

  const calculateChange = async () => {
    try {
      if (!startDate || !endDate) {
        toast({
          title: 'Hata',
          description: 'Lütfen hem başlangıç hem de bitiş tarihlerini seçin',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // Tarih aralığındaki tüm verileri filtrele
      const filteredData = originalData.filter(item => {
        if (!item.Date || !startDate || !endDate) return false;
        const itemTime = item.Date.getTime();
        const startTime = startDate.getTime();
        const endTime = endDate.getTime();
        
        // Doğrudan zaman damgası karşılaştırması yap
        // Son ayın değerini de dahil etmek için <= yerine < kullanıyoruz
        // ve endDate'in ay sonunu temsil etmesini sağlıyoruz
        const adjustedEndTime = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getTime();
        return itemTime >= startTime && itemTime <= adjustedEndTime;
      });

      if (filteredData.length === 0) {
        toast({
          title: 'Hata',
          description: 'Seçilen tarihler için veri bulunamadı',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      const startItem = filteredData[0];
      const endItem = filteredData[filteredData.length - 1];

      const change = ((endItem.CPI - startItem.CPI) / startItem.CPI) * 100;
      setCpiChange(change.toFixed(2));
      
      // Grafik verilerini başlangıç tarihine göre yüzdelik olarak güncelle
      const updatedData = filteredData.map(item => ({
        ...item,
        CPI: ((item.CPI - startItem.CPI) / startItem.CPI) * 100
      }));
      
      setData(updatedData);
    } catch (error) {
      toast({
        title: 'Hesaplama Hatası',
        description: 'TÜFE değişimi hesaplanırken bir hata oluştu',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="1200px" mx="auto" p={8}>
      <Heading as="h1" size="xl" mb={8} textAlign="center" color="blue.600">
        TÜFE Değişim Hesaplayıcı
      </Heading>

      <Flex direction={{ base: 'column', md: 'row' }} gap={8}>
        <Box flex={1} bg="white" p={6} borderRadius="lg" boxShadow="md">
          <VStack spacing={6} align="stretch">
            <Heading as="h2" size="lg">Tarih Seçimi</Heading>
            
            <Box>
              <Text mb={2} fontWeight="medium">Başlangıç Tarihi</Text>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                placeholderText="Başlangıç ayı seçin"
                className="date-picker"
              />
            </Box>

            <Box>
              <Text mb={2} fontWeight="medium">Bitiş Tarihi</Text>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                placeholderText="Bitiş ayı seçin"
                className="date-picker"
              />
            </Box>

            <Button colorScheme="blue" onClick={calculateChange} size="lg">
              TÜFE Değişimini Hesapla
            </Button>

            {cpiChange && (
              <Box mt={4} p={4} bg="blue.50" borderRadius="md">
                <Text fontSize="xl" fontWeight="bold">
                  TÜFE Değişimi: {cpiChange}%
                </Text>
                <Text mt={2} color="gray.600">
                  From {startDate?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} 
                  to {endDate?.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>

        <Box flex={1} bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Heading as="h2" size="lg" mb={6}>TÜFE Eğilimi</Heading>
          <Box h="400px">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="Date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })}
                />
                <YAxis 
                  tickFormatter={(value) => `${value}%`}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                  formatter={(value) => [value, 'TÜFE Değişimi']}
                />
                <Legend />
                <Line type="monotone" dataKey="CPI" stroke="#3182CE" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};

export default App;