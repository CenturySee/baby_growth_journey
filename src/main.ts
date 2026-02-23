import './style.css';
import { registerRoute, startRouter } from './router';
import { renderHome } from './pages/home';
import { renderFeeding } from './pages/feeding';
import { renderDiaper } from './pages/diaper';
import { renderSupplement } from './pages/supplement';
import { renderSleep } from './pages/sleep';
import { renderEducation } from './pages/education';
import { renderCare } from './pages/care';
import { renderDailyNote } from './pages/dailyNote';

// Register all routes
registerRoute('/', renderHome);
registerRoute('/feeding', renderFeeding);
registerRoute('/diaper', renderDiaper);
registerRoute('/supplement', renderSupplement);
registerRoute('/sleep', renderSleep);
registerRoute('/education', renderEducation);
registerRoute('/care', renderCare);
registerRoute('/dailynote', renderDailyNote);

// Start the router
startRouter();
