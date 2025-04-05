import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, Text, View, Alert, FlatList, TextInput, Linking } from 'react-native';

const Stack = createNativeStackNavigator();

// HomeScreen component
const HomeScreen = ({ navigation }) => (
  <View>
    <Text>Welcome to the Job Board</Text>
    <Button title="Go to Jobs Screen" onPress={() => navigation.navigate('Jobs')} />
    <StatusBar style="auto" />
  </View>
);

// JobsScreen component
const JobsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('https://d903-2001-bb6-9f03-52e8-3c80-5a0d-803a-9dee.ngrok-free.app/jobs');
        const data = await res.json();
        if (data.jobs) {
          setJobs(data.jobs);
          setFilteredJobs(data.jobs); // Set both jobs and filtered jobs initially
        } else {
          Alert.alert('Error', 'No jobs found.');
        }
      } catch {
        Alert.alert('Error', 'Failed to fetch jobs.');
      }
    };
    fetchJobs();
  }, []);

  const handleCityFilter = (city) => {
    setCityFilter(city);
    if (!city) {
      setFilteredJobs(jobs); // Show all jobs if no city filter
    } else {
      const filtered = jobs.filter(job =>
        job.location.city.toLowerCase().includes(city.toLowerCase())
      );
      setFilteredJobs(filtered); // Filter jobs based on city
    }
  };

  return (
    <View>
      <Text>Available Jobs</Text>
      <TextInput
        placeholder="Filter by city"
        value={cityFilter}
        onChangeText={handleCityFilter}
        style={{ borderWidth: 1, marginBottom: 10, padding: 5 }}
      />
      <FlatList
        data={filteredJobs}
        renderItem={({ item }) => (
          <View style={{ padding: 10, marginBottom: 10, borderBottomWidth: 1 }} onTouchEnd={() => navigation.navigate('JobDetails', { job: item })}>
            <Text>{item.company} - {item.role}</Text>
            <Text>{item.location.city}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
};

// JobDetails component
const JobDetails = ({ route }) => {
  const { job } = route.params;
  const [fullJobDetails, setFullJobDetails] = useState(null);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const res = await fetch(`https://d903-2001-bb6-9f03-52e8-3c80-5a0d-803a-9dee.ngrok-free.app/jobs/${job.id}`);
        const data = await res.json();
        setFullJobDetails(data.job || {});
      } catch {
        console.error('Error fetching job details');
      }
    };
    fetchJobDetails();
  }, [job.id]);

  if (!fullJobDetails) return <Text>Loading...</Text>;

  return (
    <View style={{ padding: 15 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Job Details</Text>
      <Text>{fullJobDetails.company} - {fullJobDetails.role}</Text>
      <Text>{fullJobDetails.location.city}, {fullJobDetails.location.country}</Text>
      <Text>Type: {fullJobDetails.employment?.type || 'Not specified'}</Text>
      <Text>Mode: {fullJobDetails.employment?.mode || 'Not specified'}</Text>
      <Text>Skill Level: {fullJobDetails.employment?.level || 'Not specified'}</Text>
      <Text>Experience: {fullJobDetails.employment?.minExperience || 'Not specified'} years</Text>

      <Text style={{ fontWeight: 'bold', marginTop: 15 }}>Description:</Text>
      <Text>{fullJobDetails.description?.summary || 'No description available'}</Text>

      <Text style={{ fontWeight: 'bold', marginTop: 15 }}>Skills:</Text>
      <Text>{fullJobDetails.skills?.required?.join(', ') || 'Not specified'}</Text>
      <Text>{fullJobDetails.skills?.languages?.join(', ') || 'Not specified'}</Text>
      <Text>{fullJobDetails.skills?.technologies?.join(', ') || 'Not specified'}</Text>

      <Text style={{ fontWeight: 'bold', marginTop: 15 }}>Educational Requirements:</Text>
      <Text>{fullJobDetails.description?.requirements || 'Not specified'}</Text>

      {fullJobDetails.urls?.linkedin && (
        <Button title="Apply on LinkedIn" onPress={() => Linking.openURL(fullJobDetails.urls.linkedin)} color="#0077B5" />
      )}
      {fullJobDetails.urls?.alternative && (
        <Button title="Apply on Company Website" onPress={() => Linking.openURL(fullJobDetails.urls.alternative)} color="#4CAF50" />
      )}
    </View>
  );
};

// App component with navigation setup
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Jobs" component={JobsScreen} />
        <Stack.Screen name="JobDetails" component={JobDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
