export interface HasOpacity {
    /**
     * @param o 0..100
     */
    setOpacity(o: number);

    /**
     * @return 0..100
     */
    getOpacity(): number;
}