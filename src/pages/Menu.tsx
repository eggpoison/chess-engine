import { PlayerColours } from "../computer-ai";

export enum ComputerDifficulties {
   Monkey,
   Easy,
   Medium,
   Hard
}

export const Menu = () => {
   return <>
      <h1 id="game-title">Bad Chess Clone</h1>

      <div id="menu">
         {[-1, -1].map((_, i: number) => {
            const colour = PlayerColours[i ? 0 : 1];

            return (
               <div key={i} className="player-container">
                  <p className="player-colour">{colour} Player</p>

                  <div className="section">
                     <label>Player type:</label>
                     <select>
                        <option>Human</option>
                        <option>Computer</option>
                     </select>
                  </div>

                  <div className="section">
                     <label>Computer Difficulty:</label>
                     <select>
                        {Object.values(ComputerDifficulties).map((difficulty, i) => {
                           if (i >= Object.keys(ComputerDifficulties).length / 2) return null;

                           return <option key={i}>{difficulty}</option>;
                        })}
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
   </>;
}

export default Menu;