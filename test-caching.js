import http from 'k6/http';

export let options = {
    vus: 100,      // Number of virtual users
    duration: '30s',   // Test duration
};

export default function () {
    http.get('http://localhost:3000/weather');
}