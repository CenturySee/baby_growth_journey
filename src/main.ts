import './style.css';
import { registerRoute, startRouter, navigate } from './router';
import { getFamilyCode } from './api';
import { renderLogin } from './pages/login';
import { renderHome } from './pages/home';
import { renderFeeding } from './pages/feeding';
import { renderDiaper } from './pages/diaper';
import { renderSupplement } from './pages/supplement';
import { renderSleep } from './pages/sleep';
import { renderEducation } from './pages/education';
import { renderCare } from './pages/care';
import { renderDailyNote } from './pages/dailyNote';

// Register all routes
registerRoute('/login', renderLogin);
registerRoute('/', () => {
    // Auth check: redirect to login if no family code
    if (!getFamilyCode()) {
        navigate('/login');
        return;
    }
    renderHome();
});
registerRoute('/feeding', renderFeeding);
registerRoute('/diaper', renderDiaper);
registerRoute('/supplement', renderSupplement);
registerRoute('/sleep', renderSleep);
registerRoute('/education', renderEducation);
registerRoute('/care', renderCare);
registerRoute('/dailynote', renderDailyNote);

// Start the router
startRouter();
