import React, { useState, useEffect, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, Text, View, Alert, FlatList, TextInput, Linking, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'http://54.226.103.193:3010';

const Stack = createNativeStackNavigator();

// Simplified styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F8F9FA',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 15,
    width: '100%',
  },
  jobItem: {
    padding: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    width: '100%',
  },
  section: {
    marginTop: 15,
    marginBottom: 5,
    fontWeight: 'bold',
  }
});

// HomeScreen component
const HomeScreen = ({ navigation }) => (
  <View style={styles.container}>
    <Text style={styles.header}>Welcome to the Job Board</Text>
    <Button title="Jobs Screen" onPress={() => navigation.navigate('Jobs')} />
    <Button title="Saved Jobs" onPress={() => navigation.navigate('SavedJobs')} />
    <Button title="Sign In" onPress={() => navigation.navigate('SignIn')} />
    <Button title="Sign Up" onPress={() => navigation.navigate('SignUp')} />
    <StatusBar style="auto" />
  </View>
);

// JobsScreen component - simplified
const JobsScreen = ({ navigation }) => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/jobs`)
      .then(res => res.json())
      .then(data => {
        if (data.jobs) {
          setJobs(data.jobs);
        } else {
          Alert.alert('Error', 'No jobs found.');
        }
      })
      .catch(() => {
        Alert.alert('Error', 'Failed to fetch jobs.');
      });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Jobs</Text>
      <FlatList
        data={jobs}
        renderItem={({ item }) => (
          <View
            style={styles.jobItem}
            onTouchEnd={() => navigation.navigate('JobDetails', { job: item })}
          >
            <Text>{item.company} - {item.role}</Text>
            <Text>{item.location.city}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        style={{ width: '100%' }}
      />
    </View>
  );
};

// JobDetails component - simplified
const JobDetails = ({ route }) => {
  const { job } = route.params;
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/jobs/${job.id}`)
      .then(res => res.json())
      .then(data => {
        setDetails(data.job);
      })
      .catch(err => {
        console.error('Error fetching job details', err);
      });
  }, [job.id]);

  if (!details) return <Text>Loading...</Text>;

  return (
    <ScrollView>
      <Text style={styles.header}>{details.company} - {details.role}</Text>
      <Text>{details.location.city}, {details.location.country}</Text>
      <Text>Type: {details.employment?.type}</Text>
      <Text>Mode: {details.employment?.mode}</Text>

      <Text style={styles.section}>Description:</Text>
      <Text>{details.description?.summary}</Text>

      <Text style={styles.section}>Skills:</Text>
      <Text>{details.skills?.required?.join(', ')}</Text>

      <Text style={styles.section}>Languages:</Text>
      <Text>{details.skills?.languages?.join(', ')}</Text>

      {details.urls?.linkedin && (
        <Button
          title="Apply on LinkedIn"
          onPress={() => Linking.openURL(details.urls.linkedin)}
        />
      )}

      <SaveJobButton jobId={job.id} />
    </ScrollView>
  );
};

// SignInScreen - simplified but keeping the real authentication
const SignInScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    try {
      const response = await fetch(`${BASE_URL}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await SecureStore.setItemAsync('userToken', data.token);
        navigation.navigate('Home');
        Alert.alert('Success', 'Signed in successfully!');
      } else {
        Alert.alert('Error', data.error || 'Invalid credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign In</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <Button title="Sign In" onPress={handleSignIn} />
    </View>
  );
};

// SignUpScreen - simplified
const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async () => {
    try {
      const response = await fetch(`${BASE_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('SignIn');
      } else {
        Alert.alert('Error', data.error || 'Failed to create account');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign Up</Text>
      <TextInput
        style={styles.input}
        value={username}
        onChangeText={setUsername}
        placeholder="Username"
      />
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
      />
      <Button title="Sign Up" onPress={handleSignUp} />
    </View>
  );
};

// SaveJobButton - simplified
const SaveJobButton = ({ jobId }) => {
  const [status, setStatus] = useState(null);

  const handleSave = async () => {
    const token = await SecureStore.getItemAsync('userToken');

    if (!token) {
      Alert.alert('Error', 'You must be signed in to save jobs.');
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/save-jobs/${jobId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setStatus('Job saved!');
      } else {
        setStatus('Failed to save job.');
      }
    } catch (err) {
      setStatus('An error occurred.');
    }
  };

  return (
    <View style={{ marginTop: 20 }}>
      <Button title="Save Job" onPress={handleSave} />
      {status && <Text style={{ marginTop: 10 }}>{status}</Text>}
    </View>
  );
};

// SavedJobsScreen 
const SavedJobsScreen = ({ navigation }) => {
  const [savedJobs, setSavedJobs] = useState([]);

  useFocusEffect(
    useCallback(() => {
      const fetchSavedJobs = async () => {
        const token = await SecureStore.getItemAsync('userToken');
        if (!token) {
          Alert.alert('Error', 'You must be signed in to view saved jobs.');
          return;
        }

        try {
          const response = await fetch(`${BASE_URL}/saved-jobs`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (response.ok && data.success) {
            setSavedJobs(data.jobs);
          } else {
            Alert.alert('Error', data.error || 'Failed to fetch saved jobs');
          }
        } catch (err) {
          Alert.alert('Error', 'Server error');
        }
      };

      fetchSavedJobs();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Jobs</Text>
      <FlatList
        data={savedJobs}
        renderItem={({ item }) => (
          <View
            style={styles.jobItem}
            onTouchEnd={() => navigation.navigate('SavedJobDetails', { job: item })}
          >
            <Text>{item.company} - {item.role}</Text>
            <Text>{item.location.city}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        style={{ width: '100%' }}
      />
    </View>
  );
};

const SavedJobDetails = ({ route, navigation }) => {
  const { job } = route.params;
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetch(`${BASE_URL}/jobs/${job.id}`)
      .then(res => res.json())
      .then(data => setDetails(data.job))
      .catch(err => console.error('Error fetching job details', err));
  }, [job.id]);

  if (!details) return <Text>Loading...</Text>;

  return (
    <ScrollView>
      <Text style={styles.header}>{details.company} - {details.role}</Text>
      <Text>{details.location.city}, {details.location.country}</Text>
      <Text>Type: {details.employment?.type}</Text>
      <Text>Mode: {details.employment?.mode}</Text>

      <Text style={styles.section}>Description:</Text>
      <Text>{details.description?.summary}</Text>

      <Text style={styles.section}>Skills:</Text>
      <Text>{details.skills?.required?.join(', ')}</Text>

      <Text style={styles.section}>Languages:</Text>
      <Text>{details.skills?.languages?.join(', ')}</Text>

      {details.urls?.linkedin && (
        <Button
          title="Apply on LinkedIn"
          onPress={() => Linking.openURL(details.urls.linkedin)}
        />
      )}

      <DeleteSavedJobButton jobId={job.id} navigation={navigation} />
    </ScrollView>
  );
};

const DeleteSavedJobButton = ({ jobId, navigation }) => {
  const [status, setStatus] = useState(null);

  const handleDelete = async () => {
    const token = await SecureStore.getItemAsync('userToken');
    if (!token) {
      Alert.alert('Error', 'You must be signed in.');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/saved-jobs/${jobId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('Removed');
        Alert.alert('Removed', 'Job removed from saved jobs.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        setStatus('Failed to remove');
      }
    } catch (err) {
      console.error('Remove job error:', err);
      setStatus('Error occurred');
    }
  };

  return (
    <View style={{ marginTop: 20 }}>
      <Button
        title="Remove from Saved"
        color="tomato"
        onPress={handleDelete}
      />
      {status && <Text style={{ marginTop: 10 }}>{status}</Text>}
    </View>
  );
};

// App Navigation
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Jobs" component={JobsScreen} />
        <Stack.Screen name="JobDetails" component={JobDetails} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="SavedJobs" component={SavedJobsScreen} />
        <Stack.Screen name="SavedJobDetails" component={SavedJobDetails} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}