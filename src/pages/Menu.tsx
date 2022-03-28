import { PlayerColours } from "../computer-ai";


export const Menu = () => {
   return (
      <div id="menu">
         {[-1, -1].map((_, i: number) => {
            const colour = PlayerColours[i];

            return (
               <div key={i} className="player-container">
                  <p className="player-type">{colour}</p>

                  <div className="section">
                     <label>Player type:</label>
                     <select>
                        <option>Human</option>
                        <option>Computer</option>
                     </select>
                  </div>

                  <div className="section">
                     <label>Time limit:</label>
                     <select>
                        <option>Endless</option>
                        <option>5 minutes</option>
                        <option>3 minutes</option>
                     </select>
                  </div>
               </div>
            );
         })}
      </div>
   );
}

export default Menu;